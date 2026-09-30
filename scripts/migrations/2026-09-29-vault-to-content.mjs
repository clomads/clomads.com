// One-time conversion of the Obsidian vault (folded into _vault/) into the site's own content folders.
// Usage: node scripts/migrations/2026-09-29-vault-to-content.mjs
// Each work note becomes src/content/docs/<section>/<slug>/index.md with its images beside it (original files,
// not the publish step's resized copies; Astro optimizes them at build). Pages/Home becomes src/content/home.md.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const VAULT = path.join(ROOT, '_vault');
const ATT = path.join(VAULT, 'X - Media', 'Attachments');
const DOCS = path.join(ROOT, 'src', 'content', 'docs');

const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const fileSlug = (name) => { const ext = path.extname(name).toLowerCase().replace('.jpeg', '.jpg'); return slug(path.basename(name, path.extname(name))) + ext; };

function readNote(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  return { data: YAML.parse(m[1]), body: raw.slice(m[0].length) };
}

// every note first, so wikilinks can resolve to the new paths
const notes = [];
for (const dir of ['Work', 'Personal']) for (const f of fs.readdirSync(path.join(VAULT, dir))) {
  if (!f.endsWith('.md')) continue;
  const n = readNote(path.join(VAULT, dir, f));
  notes.push({ ...n, name: path.basename(f, '.md'), id: `${n.data.section}/${slug(n.data.title)}` });
}
const idOf = new Map(notes.map((n) => [n.name, n.id]));

function convert(body, outDir) {
  let s = body;
  const copy = (name) => {
    const src = path.join(ATT, name);
    if (!fs.existsSync(src)) throw new Error(`missing attachment ${name}`);
    const out = fileSlug(name);
    fs.copyFileSync(src, path.join(outDir, out));
    return out;
  };
  // embeds: ![[file|width]] -> ![|width](./file); the |width hint is read by src/lib/remark-clomads.mjs
  s = s.replace(/!\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g, (_, name, opts) => {
    const w = String(opts ?? '').split(/[\s|]+/).filter((t) => /^\d+$/.test(t)).pop();
    return `![${w ? `|${w}` : ''}](./${copy(name.trim())})`;
  });
  // Obsidian callouts -> Starlight asides
  const KIND = { info: 'note', note: 'note', tip: 'tip', warning: 'caution', danger: 'danger' };
  s = s.replace(/^> \[!(\w+)\][ \t]*([^\n]*)\n((?:>[^\n]*\n?)*)/gm, (_, type, title, rest) => {
    const inner = rest.split('\n').map((l) => l.replace(/^>\s?/, '')).join('\n').trim();
    return `:::${KIND[type.toLowerCase()] ?? 'note'}${title.trim() ? `[${title.trim()}]` : ''}\n${inner}\n:::\n`;
  });
  // wikilinks -> site links
  s = s.replace(/\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g, (_, t, label) => `[${label ?? t}](/${idOf.get(t.trim())}/)`);
  // headings: the page title is the H1, so the note's top level becomes H2
  const lines = s.split('\n'); let fence = false, min = 7;
  for (const l of lines) { if (/^```/.test(l)) { fence = !fence; continue; } if (!fence) { const m = l.match(/^(#{1,6}) /); if (m) min = Math.min(min, m[1].length); } }
  const shift = min < 7 ? 2 - min : 0; fence = false;
  s = lines.map((l) => { if (/^```/.test(l)) { fence = !fence; return l; } return fence ? l : l.replace(/^(#{1,6}) /, (_, h) => '#'.repeat(Math.max(1, Math.min(6, h.length + shift))) + ' '); }).join('\n');
  return s.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

fs.rmSync(DOCS, { recursive: true, force: true });
for (const n of notes) {
  const d = n.data;
  const outDir = path.join(DOCS, n.id);
  fs.mkdirSync(outDir, { recursive: true });
  const body = convert(n.body, outDir);
  let hero;
  if (d.hero) { const out = fileSlug(d.hero); fs.copyFileSync(path.join(ATT, d.hero), path.join(outDir, out)); hero = `./${out}`; }
  const fm = {
    title: d.title,
    ...(d.description ? { description: d.description } : {}),
    ...(d.year ? { year: d.year } : {}), ...(d.until ? { until: d.until } : {}),
    ...(d.role ? { role: d.role } : {}), ...(d.client ? { client: d.client } : {}),
    ...(d.status ? { status: d.status } : {}), ...(d.order != null ? { order: d.order } : {}),
    ...(hero ? { cover: hero } : {}),  // `hero` is Starlight's own splash field
    ...(d.links?.length ? { links: d.links } : {}),
    ...(d.tags?.length ? { tags: d.tags } : {}),
    ...(d.publish === true ? {} : { draft: true }),
    ...(d.redirect_from?.length ? { redirect_from: d.redirect_from } : {}),
  };
  fs.writeFileSync(path.join(outDir, 'index.md'), `---\n${YAML.stringify(fm, { lineWidth: 0 })}---\n\n${body}`);
}

// home: prose stays in the body; the [!cards] callout becomes the featured list in frontmatter
{
  const { data, body } = readNote(path.join(VAULT, 'Pages', 'Home.md'));
  const featured = [];
  let s = body.replace(/^> \[!cards\][^\n]*\n((?:>[^\n]*\n?)*)/m, (_, rest) => { for (const m of rest.matchAll(/\[\[([^\]|#]+)/g)) featured.push(idOf.get(m[1].trim())); return ''; });
  s = s.replace(/\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g, (_, t, label) => `[${label ?? t}](/${idOf.get(t.trim())}/)`).replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const fm = { title: data.title, description: data.description, featured };
  fs.writeFileSync(path.join(ROOT, 'src', 'content', 'home.md'), `---\n${YAML.stringify(fm, { lineWidth: 0 })}---\n\n${s}`);
}
console.log(`converted ${notes.length} pages + home`);
