// Filters the vault down to public content and writes it into the site repo.
// Usage: node scripts/publish.mjs --out ~/claudecode/clomads/portfolio
// Only notes with publish: true leave the vault. [!internal] callouts and %% comments %% are stripped,
// private frontmatter is dropped, wikilinks become site links, and referenced attachments are copied.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, walk, rel, readNote, loadSchemas, slug } from './lib.mjs';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT = outIdx >= 0 ? path.resolve(args[outIdx + 1].replace(/^~/, process.env.HOME)) : null;
if (!OUT) { console.error('usage: node scripts/publish.mjs --out <site repo>'); process.exit(2); }
const DOCS = path.join(OUT, 'src', 'content', 'docs');
const ATT_OUT = path.join(OUT, 'public', 'attachments');
const DATA = path.join(OUT, 'src', 'data');
const SECTIONS = loadSchemas().work['x-sections'];
const IMAGE = /\.(png|jpe?g|gif|svg|webp|avif)$/i;
const RASTER = /\.(png|jpe?g|webp)$/i;
const MAX_IMAGE_WIDTH = 1600;

// ---------- vault index ----------
const templatesDir = (() => { try { return path.join(ROOT, JSON.parse(fs.readFileSync(path.join(ROOT, '.obsidian', 'templates.json'), 'utf8')).folder); } catch { return null; } })();
const byBasename = new Map();   // "image.png" -> absolute path (first wins, Attachments preferred)
const notes = [];
for (const file of walk()) {
  const base = path.basename(file);
  if (!byBasename.has(base) || file.includes('/X - Media/Attachments/')) byBasename.set(base, file);
  if (!file.endsWith('.md')) continue;
  if (templatesDir && file.startsWith(templatesDir + path.sep)) continue;
  const n = readNote(file);
  if (n.data && (n.data.type === 'work' || n.data.type === 'page')) notes.push(n);
}
const noteByBasename = new Map(notes.map(n => [path.basename(n.file, '.md'), n]));

// ---------- site paths ----------
function slugFor(n) {
  const first = (n.data.redirect_from ?? [])[0];
  if (first) return first.split('/').filter(Boolean).pop()
    .replace(/\.+$/, '').replace(/\./g, ''); // Astro drops dots from slugs; match it so redirects line up
  return slug(n.data.title ?? path.basename(n.file, '.md'));
}
function sitePath(n) {
  const d = n.data;
  if (d.type === 'page') {
    // Pages/Home is the landing page copy (no route of its own), Pages/404 the not-found page, anything else /<slug>/
    const b = path.basename(n.file, '.md'); return b === 'Home' ? 'index' : b === '404' ? '404' : slugFor(n);
  }
  return d.section ? `${d.section}/${slugFor(n)}` : null;
}
const published = notes.filter(n => n.data.publish === true);
const pathOf = new Map();
const errors = [];
for (const n of published) {
  const p = sitePath(n);
  if (!p) { errors.push(`${n.rel}: published but has no section`); continue; }
  if ([...pathOf.values()].includes(p)) errors.push(`${n.rel}: site path ${p} already used`);
  pathOf.set(n, p);
}

// ---------- assets ----------
const copiedAssets = new Set();
// Which source produced each file in public/attachments/. A copy whose source hash matches is left as is,
// so an image optimized by CI is not re-encoded (differently) by a local run, or vice versa.
const MANIFEST = path.join(DATA, 'attachments.json');
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const manifestOut = {};
const hashOf = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
const unchanged = new Set();
const warnings = [];              // printed, but never block a publish
const drawingSet = new Set();     // Excalidraw SVG exports: background rectangle removed, embedded bitmaps slimmed
const optimizeSet = new Set();   // embedded images and heroes: resized and recompressed for the site
const keepSet = new Set();       // downloads (files:, linked attachments): copied byte for byte
function assetUrl(name, { keep = false } = {}) {
  const src = byBasename.get(name);
  if (!src) { errors.push(`missing attachment: ${name}`); return null; }
  fs.mkdirSync(ATT_OUT, { recursive: true });
  const dest = path.join(ATT_OUT, name);
  if (!copiedAssets.has(name)) {
    const srcBuf = fs.readFileSync(src); const h = hashOf(srcBuf);
    manifestOut[name] = h;
    if (fs.existsSync(dest) && manifest[name] === h) unchanged.add(name);   // keep the existing (possibly optimized) copy
    else fs.writeFileSync(dest, srcBuf);
  }
  copiedAssets.add(name);
  if (keep) keepSet.add(name); else if (RASTER.test(name)) optimizeSet.add(name);
  return '/attachments/' + encodeURI(name);
}
const anchor = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-'); // matches Starlight's heading ids (github-slugger)
const looseSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-and-/g, '-').replace(/^-|-$/g, '');

// ---------- images ----------
// Options come from Obsidian's "|" suffix (![[a.png|invert 400]]) or a plain image's alt text (![invert](url)).
// "invert" adds a class the site flips in dark mode (for black-on-transparent line art); a number is the width.
function imgTag(url, opts) {
  const tokens = String(opts).trim().split(/[\s,|]+/).filter(Boolean); // Obsidian's resize handle adds "|WxH" as its own segment
  const invert = tokens.includes('invert');
  const size = tokens.filter(t => /^\d+(x\d+)?$/.test(t)).pop(); // last one wins, so a resize in Obsidian overrides an older width
  const width = size ? size.split('x')[0] : null;
  if (!invert && !width) return `![](${url})`;
  return `<img src="${url}" alt=""${width ? ` width="${width}"` : ''}${invert ? ' class="invert-dark"' : ''} />`;
}

// ---------- drawings ----------
// An Excalidraw embed publishes as the drawing's SVG export (Excalidraw setting: Auto-export SVG), which the
// plugin writes next to the drawing as name.excalidraw.svg. Vector, so it stays sharp at any size. The export's
// white background rectangle is removed at publish so the page shows through; colors are left exactly as drawn.
const DRAWING = /\.excalidraw(\.md)?$/i;
function drawingTag(target, opts, note) {
  const base = target.trim().replace(/\.md$/i, '');
  const svg = [base + '.svg', base.replace(/\.excalidraw$/i, '') + '.svg'].find((n) => byBasename.has(n));
  if (!svg) { warnings.push(`${note?.rel ?? ''}: drawing "${base}" has no SVG export yet, so it was left off the page. In Excalidraw's settings turn on "Auto-export SVG", then re-save the drawing.`); return ''; }
  const url = assetUrl(svg, { keep: true }); if (!url) return '';
  drawingSet.add(svg);
  const size = String(opts ?? '').split(/[\s,|]+/).filter((t) => /^\d+(x\d+)?$/.test(t)).pop();
  return `<img src="${url}" alt="" class="drawing"${size ? ` width="${size.split('x')[0]}"` : ''} />`;
}

// ---------- body transforms ----------
const CALLOUT = { note: 'note', info: 'note', abstract: 'note', summary: 'note', todo: 'note', question: 'note', quote: 'note', example: 'note',
  tip: 'tip', hint: 'tip', success: 'tip', check: 'tip', done: 'tip',
  warning: 'caution', caution: 'caution', attention: 'caution', missing: 'caution',
  danger: 'danger', error: 'danger', bug: 'danger', failure: 'danger', fail: 'danger' };

export function transform(body, note) {
  let s = body;
  s = s.replace(/%%[\s\S]*?%%/g, '');
  // drop internal callouts (the whole quoted block)
  s = s.replace(/^> \[!internal\][^\n]*\n(?:>[^\n]*\n?)*/gim, '');
  if (pathOf.get(note) === 'index') {
    // landing page: a [!cards] callout listing work notes becomes a card grid (split out at write time)
    s = s.replace(/^> \[!cards\][^\n]*\n((?:>[^\n]*\n?)*)/gim, (_, rest) => {
      const paths = [...rest.matchAll(/\[\[([^\]|#]+)/g)].map(m => noteByBasename.get(m[1].trim())).map(n => n && pathOf.get(n)).filter(Boolean).map(p => `/${p}/`);
      return `\n<!--cards:${paths.join(',')}-->\n`;
    });
    // a list item that is just a link to a note gets that note's description
    s = s.replace(/^([ \t]*[-*] )\[\[([^\]|#]+)\]\][ \t]*$/gm, (line, pre, target) => { const d = noteByBasename.get(target.trim())?.data.description; return d ? `${pre}[[${target}]] — ${d}` : line; });
  }
  // callouts -> asides
  s = s.replace(/^> \[!(\w+)\]([+-]?)[ \t]*([^\n]*)\n((?:>[^\n]*\n?)*)/gm, (_, type, _fold, title, rest) => {
    const kind = CALLOUT[type.toLowerCase()] ?? 'note';
    const inner = rest.split('\n').map(l => l.replace(/^>\s?/, '')).join('\n').replace(/\s+$/, '');
    const t = title.trim() || (['example', 'quote', 'abstract', 'todo', 'question'].includes(type.toLowerCase()) ? type[0].toUpperCase() + type.slice(1).toLowerCase() : '');
    return `:::${kind}${t ? `[${t}]` : ''}\n${inner}\n:::\n`;
  });
  s = s.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
  // embeds
  s = s.replace(/^!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\][ \t]*$/gm, (line, target, opts) => {
    if (target.endsWith('.base')) return '';
    if (DRAWING.test(target.trim())) return drawingTag(target, opts, note);
    const name = target.trim();
    if (!path.extname(name)) return '';                          // note transclusion: not supported, drop
    const url = assetUrl(name, { keep: !IMAGE.test(name) }); if (!url) return '';
    if (IMAGE.test(name)) return imgTag(url, opts ?? '');
    return `[${name}](${url})`;
  });
  s = s.replace(/!\[\[([^\]|#]+)(?:\|([^\]]*))?\]\]/g, (_, target, opts) => { if (DRAWING.test(target.trim())) return drawingTag(target, opts, note); const u = IMAGE.test(target) ? assetUrl(target.trim()) : null; return u ? imgTag(u, opts ?? '') : ''; });
  // external embeds of YouTube videos -> a player
  s = s.replace(/^!\[[^\]]*\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})[^)]*)\)[ \t]*$/gm, (_, url, id) =>
    `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`);
  // plain markdown images with options in the alt text: ![invert](https://…), ![|570x553](https://…)
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (all, alt, url) => (/invert|^\|?\d+(x\d+)?$/.test(alt.trim()) ? imgTag(url, alt.replace(/^\|/, '')) : all));
  // an image on its own line followed by an *italic line* is a figure with a caption
  s = s.replace(/^(<img [^>]*\/>|!\[\]\(([^)\s]+)\))\n\*([^*\n]+)\*[ \t]*$/gm, (_, img, url, cap) =>
    `<figure>${url ? `<img src="${url}" alt="" />` : img}<figcaption>${cap.trim()}</figcaption></figure>`);
  // wikilinks
  s = s.replace(/\[\[([^\]|#]*)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g, (_, target, section, text) => {
    const n = target ? noteByBasename.get(target.trim()) : note;
    const label = (text ?? (section && !target ? section : (n?.data.title ?? target))).trim();
    if (target && path.extname(target) && !target.endsWith('.md')) { const u = assetUrl(target.trim(), { keep: true }); return u ? `[${label}](${u})` : label; }
    const p = n ? pathOf.get(n) : null;
    if (!p) return label;
    const href = (p === 'index' ? '/' : `/${p}/`) + (section ? `#${anchor(section)}` : '');
    return `[${label}](${href})`;
  });
  // Headings: the note's top level becomes H2 on the site (the page title is the H1), so notes written
  // with H1 sections and notes written with H2 sections publish the same way. Fenced code is left alone.
  {
    const ls = s.split('\n'); let fence = false, min = 7;
    for (const l of ls) { if (/^```/.test(l)) { fence = !fence; continue; } if (fence) continue; const m = l.match(/^(#{1,6}) /); if (m) min = Math.min(min, m[1].length); }
    const shift = min < 7 ? 2 - min : 0;
    if (shift) { fence = false; s = ls.map(l => { if (/^```/.test(l)) { fence = !fence; return l; } if (fence) return l; return l.replace(/^(#{1,6}) /, (_, h) => '#'.repeat(Math.max(1, Math.min(6, h.length + shift))) + ' '); }).join('\n'); }
  }
  // remove headings whose section ended up empty
  const lines = s.split('\n'); const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6}) /);
    if (!m) { out.push(lines[i]); continue; }
    const level = m[1].length; let j = i + 1, hasContent = false;
    for (; j < lines.length; j++) { const h = lines[j].match(/^(#{1,6}) /); if (h && h[1].length <= level) break; if (lines[j].trim()) { hasContent = true; break; } }
    if (hasContent) out.push(lines[i]); else { i = j - 1; }
  }
  s = out.join('\n').replace(/^\s*---\s*\n/, ''); // a note whose own body was empty starts at the import divider
  return s.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// ---------- write ----------
fs.rmSync(DOCS, { recursive: true, force: true });
fs.mkdirSync(DOCS, { recursive: true }); fs.mkdirSync(DATA, { recursive: true });
const worksOut = [];
const redirects = {};
// "2014", "2015–2017", "2020–" (ongoing with no end year)
const years = (d) => (d.year ? `${d.year}${d.until && d.until !== d.year ? `–${d.until}` : d.status === 'ongoing' ? '–' : ''}` : null);
const STATUS_LABEL = { concept: 'Concept', prototype: 'Prototype', ongoing: 'Ongoing', shelved: 'Shelved' }; // complete says nothing
for (const [n, p] of pathOf) {
  const d = n.data;
  const body = transform(n.body, n);
  const heroUrl = d.hero ? assetUrl(path.basename(d.hero)) : null;
  // the header shows the hero only when the body does not already open with (or embed) the same image
  const heroInBody = heroUrl && body.includes(heroUrl);
  const fm = { title: d.title, ...(d.description ? { description: d.description } : {}) };
  fm.sidebar = { order: d.order ?? (d.year ? 3000 - d.year : 2000) };   // newest first unless ordered
  if (p === '404') { fm.pagefind = false; fm.sidebar.hidden = true; }
  const links = (d.links ?? []).map(l => (typeof l === 'string' ? { url: l } : { url: l.url, ...(l.label ? { label: l.label } : {}) }));
  const files = (d.files ?? []).map(f => {
    const spec = typeof f === 'string' ? { path: f } : f;
    const abs = fs.existsSync(path.resolve(path.dirname(n.file), spec.path)) ? path.resolve(path.dirname(n.file), spec.path) : byBasename.get(path.basename(spec.path));
    if (!abs) { errors.push(`${n.rel}: files entry not found: ${spec.path}`); return null; }
    const name = path.basename(abs);
    if (!byBasename.has(name)) byBasename.set(name, abs);
    const url = assetUrl(name, { keep: true });
    return url ? { url, name, ...(spec.label ? { label: spec.label } : {}) } : null;
  }).filter(Boolean);
  if (d.type === 'work') {
    const meta = [years(d), d.role, d.client && `for ${d.client}`].filter(Boolean);
    fm.clomads = { type: 'work', section: d.section, ...(meta.length ? { meta } : {}), ...(STATUS_LABEL[d.status] ? { status: d.status } : {}),
      ...(heroUrl && !heroInBody ? { hero: heroUrl } : {}), ...(links.length ? { links } : {}), ...(files.length ? { files } : {}) };
    worksOut.push({ title: d.title, path: `/${p}/`, section: d.section, description: d.description ?? '', ...(heroUrl ? { hero: heroUrl } : {}),
      ...(years(d) ? { years: years(d) } : {}), ...(d.year ? { year: d.year } : {}), ...(d.featured ? { featured: true } : {}), ...(STATUS_LABEL[d.status] ? { status: STATUS_LABEL[d.status] } : {}) });
  } else {
    fm.clomads = { type: 'page', ...(heroUrl ? { hero: heroUrl } : {}) };
  }
  const headings = [...body.matchAll(/^#{1,6} (.+?)\s*$/gm)].map((m) => m[1]);
  for (const r of d.redirect_from ?? []) {
    const from = '/' + r.replace(/^\/+/, ''); let to = p === 'index' ? '/' : `/${p}/`;
    const last = from.split('/').filter(Boolean).pop();
    if (p !== 'index' && from.split('/').filter(Boolean).length > 1 && last !== p.split('/').pop()) {
      const h = headings.find((t) => looseSlug(anchor(t)) === looseSlug(last));   // old sub-page -> its section on the merged page
      if (h) to += '#' + anchor(h);
    }
    if (from !== to.replace(/\/$/, '')) redirects[from] = to;
  }
  if (p === 'index') {
    // landing page: src/data/home/meta.json + NN.md prose chunks and NN.cards.json card lists, in note order
    const dir = path.join(DATA, 'home'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ title: fm.title, description: fm.description ?? '' }, null, 2) + '\n');
    const parts = body.split(/^<!--cards:([^>]*)-->$/m); let i = 0;
    for (let k = 0; k < parts.length; k++) {
      const nn = String(i).padStart(2, '0');
      if (k % 2 === 1) { fs.writeFileSync(path.join(dir, `${nn}.cards.json`), JSON.stringify({ cards: parts[k].split(',').filter(Boolean) }, null, 2) + '\n'); i++; }
      else if (parts[k].trim()) { fs.writeFileSync(path.join(dir, `${nn}.md`), parts[k].trim() + '\n'); i++; }
    }
    continue;
  }
  const file = path.join(DOCS, `${p}.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const yaml = (await import('yaml')).default.stringify(fm, { lineWidth: 0 });
  fs.writeFileSync(file, `---\n${yaml}---\n${body}`);
}
fs.writeFileSync(path.join(DATA, 'works.json'), JSON.stringify(worksOut.sort((a, b) => ((b.year ?? 0) - (a.year ?? 0)) || a.title.localeCompare(b.title)), null, 2) + '\n');
// old addresses of notes that are not (or no longer) published send people to the front page instead of a 404
for (const n of notes) if (!pathOf.has(n)) for (const r of n.data.redirect_from ?? []) redirects['/' + r.replace(/^\/+/, '')] ??= '/';
fs.writeFileSync(path.join(DATA, 'redirects.json'), JSON.stringify(Object.fromEntries(Object.entries(redirects).sort()), null, 2) + '\n');
fs.writeFileSync(path.join(DATA, 'sections.json'), JSON.stringify(SECTIONS, null, 2) + '\n');
// Explicit sidebar: one group per section, then the standalone pages (About…)
const link = (n) => { const p = pathOf.get(n); return p === 'index' ? '/' : `/${p}/`; };
const orderOf = (n) => n.data.order ?? (n.data.year ? 3000 - n.data.year : 2000);
const sidebar = Object.entries(SECTIONS).map(([sec, secLabel]) => {
  const items = [...pathOf.keys()].filter(n => n.data.type === 'work' && n.data.section === sec)
    .sort((a, b) => (orderOf(a) - orderOf(b)) || a.data.title.localeCompare(b.data.title))
    .map(n => ({ label: n.data.title, link: link(n) }));
  return { label: secLabel, items };
}).filter(g => g.items.length);
const pages = [...pathOf].filter(([n, p]) => n.data.type === 'page' && p !== 'index' && p !== '404').sort(([a], [b]) => (a.data.order ?? 0) - (b.data.order ?? 0));
for (const [n] of pages) sidebar.push({ label: n.data.title, link: link(n) });
fs.writeFileSync(path.join(DATA, 'sidebar.json'), JSON.stringify(sidebar, null, 2) + '\n');
// ---------- images ----------
// Originals stay in the vault. Embedded images and heroes are capped at MAX_IMAGE_WIDTH and recompressed
// (same file name and format, so nothing in the pages changes); a result is only kept when it is smaller.
// Downloads listed under files: or linked as attachments are copied untouched.
{
  const sharp = (await import('sharp')).default;
  let before = 0, after = 0, n = 0;
  for (const name of optimizeSet) {
    if (keepSet.has(name) || unchanged.has(name)) continue;
    const file = path.join(ATT_OUT, name);
    const src = fs.readFileSync(file);
    try {
      const img = sharp(src, { animated: false });
      const meta = await img.metadata();
      let pipe = img.rotate();
      if ((meta.width ?? 0) > MAX_IMAGE_WIDTH) pipe = pipe.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true });
      const ext = path.extname(name).toLowerCase();
      if (ext === '.png') pipe = pipe.png({ compressionLevel: 9, palette: true, quality: 90, effort: 7 });
      else if (ext === '.webp') pipe = pipe.webp({ quality: 82, effort: 5 });
      else pipe = pipe.jpeg({ quality: 82, mozjpeg: true });
      const out = await pipe.toBuffer();
      before += src.length; n++;
      if (out.length < src.length) { fs.writeFileSync(file, out); after += out.length; } else after += src.length;
    } catch (e) { errors.push(`could not optimize image ${name}: ${e.message}`); }
  }
  // drawings: drop the full-size white background rectangle, and slim bitmaps embedded in the SVG to 3x their drawn size
  for (const name of drawingSet) {
    if (unchanged.has(name)) continue;
    const file = path.join(ATT_OUT, name);
    let svg = fs.readFileSync(file, 'utf8'); const was = svg.length;
    svg = svg.replace(/<rect x="0" y="0" width="[^"]+" height="[^"]+" fill="#(?:fff|ffffff)"\s*(?:\/>|><\/rect>)/i, '');
    const drawn = new Map([...svg.matchAll(/<use href="#([^"]+)" width="([\d.]+)"/g)].map((m) => [m[1], Number(m[2])]));
    for (const m of [...svg.matchAll(/<symbol id="([^"]+)"><image href="data:image\/(png|jpeg);base64,([^"]+)"/g)]) {
      try {
        const [, id, kind, b64] = m; const src = Buffer.from(b64, 'base64');
        const cap = Math.min(MAX_IMAGE_WIDTH, Math.round((drawn.get(id) ?? MAX_IMAGE_WIDTH) * 3));
        let pipe = sharp(src).resize({ width: cap, withoutEnlargement: true });
        pipe = kind === 'png' ? pipe.png({ compressionLevel: 9, palette: true, quality: 90, effort: 7 }) : pipe.jpeg({ quality: 82, mozjpeg: true });
        const out = await pipe.toBuffer();
        if (out.length < src.length) svg = svg.replace(b64, out.toString('base64'));
      } catch (e) { warnings.push(`could not slim a bitmap inside ${name}: ${e.message}`); }
    }
    fs.writeFileSync(file, svg);
    console.log(`drawing: ${name} ${(was / 1024).toFixed(0)} KB -> ${(svg.length / 1024).toFixed(0)} KB, background removed`);
  }
  if (n) console.log(`images: ${n} embedded, ${(before / 1048576).toFixed(1)} MB -> ${(after / 1048576).toFixed(1)} MB`);
}
// downloads copied untouched must match their source even if a stale optimized copy was kept
for (const name of keepSet) { const src = byBasename.get(name), dest = path.join(ATT_OUT, name); if (src && fs.existsSync(dest) && unchanged.has(name) && optimizeSet.has(name)) fs.copyFileSync(src, dest); }
for (const f of fs.existsSync(ATT_OUT) ? fs.readdirSync(ATT_OUT) : []) if (!copiedAssets.has(f)) fs.rmSync(path.join(ATT_OUT, f));
fs.writeFileSync(MANIFEST, JSON.stringify(Object.fromEntries(Object.entries(manifestOut).sort()), null, 2) + '\n');
console.log(`published ${pathOf.size} pages, ${copiedAssets.size} attachments, ${Object.keys(redirects).length} redirects -> ${rel(OUT) || OUT}`);
for (const w of warnings) console.log('warning ' + w);
for (const e of errors) console.log('problem ' + e);
if (errors.length) process.exit(1);
