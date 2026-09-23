// One-time import of the GitBook portfolio export (github.com/clomads/portfolio) into the vault.
// Usage: node scripts/migrations/2026-09-23-gitbook-import.mjs ~/claudecode/clomads/portfolio
// Each GitBook page becomes one note in its section's folder; Origami's sub-pages merge into one note.
// Every asset in .gitbook/assets is copied to X - Media/Attachments, referenced or not. Old paths go in redirect_from.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, splitFrontmatter, writeNote, loadSchemas } from '../lib.mjs';

const SRC = path.resolve((process.argv[2] ?? '').replace(/^~/, process.env.HOME));
if (!fs.existsSync(path.join(SRC, 'SUMMARY.md'))) { console.error('usage: gitbook-import.mjs <portfolio clone>'); process.exit(2); }
const SECTIONS = loadSchemas().work['x-sections'];
const ATT = path.join(ROOT, 'X - Media', 'Attachments');

// GitBook "featured" pages move into a real section and get featured: true
const FEATURED = { 'featured/gary-bussy': 'personal-projects', 'featured/vdbx.io-voidbox-industries': 'personal-projects', 'featured/can-of-bliss': 'design-web-and-film' };
const STATUS = { 'concepts/origami': 'shelved', 'concepts/single-motor-control-for-klipper': 'concept', 'featured/gary-bussy': 'ongoing', 'featured/vdbx.io-voidbox-industries': 'ongoing' };
const ORIGAMI_PARTS = ['keyboard', 'measurements', 'power', 'design-reference', 'display']; // SUMMARY order

// ---------- assets ----------
fs.mkdirSync(ATT, { recursive: true });
const assets = fs.readdirSync(path.join(SRC, '.gitbook', 'assets'));
for (const a of assets) fs.copyFileSync(path.join(SRC, '.gitbook', 'assets', a), path.join(ATT, a));

// ---------- body conversion ----------
const assetName = (src) => decodeURIComponent(src.replace(/^<|>$/g, '').split('.gitbook/assets/').pop());
const pageKey = (href, from) => path.posix.normalize(path.posix.join(path.posix.dirname(from), href)).replace(/\.md$/, '').replace(/\/README$/, '').replace(/^README$/, '');
const titleOf = new Map(); // page key -> note title (for wikilinks)

function convert(body, from) {
  let s = body.replace(/&#x20;/g, ' ').replace(/[ \t]+$/gm, '');
  // hints -> callouts
  s = s.replace(/\{% hint style="(\w+)" %\}\n?([\s\S]*?)\n?\{% endhint %\}/g, (_, style, inner) => {
    const kind = { info: 'info', warning: 'warning', danger: 'danger', success: 'tip' }[style] ?? 'note';
    return `> [!${kind}]\n` + inner.trim().split('\n').map((l) => (l ? `> ${l}` : '>')).join('\n');
  });
  // embeds -> Obsidian external embed (YouTube plays inline in Obsidian; the site turns it into a player)
  s = s.replace(/\{% embed url="([^"]+)" %\}/g, (_, url) => `![](${url})`);
  // figures -> embed + italic caption
  s = s.replace(/<figure><img src="([^"]+)" alt="([^"]*)"(?: width="(\d+)")?><figcaption>(?:<p>([\s\S]*?)<\/p>)?<\/figcaption><\/figure>/g, (_, src, alt, width, cap) => {
    const name = assetName(src);
    const embed = `![[${name}${width ? `|${width}` : ''}]]`;
    const caption = (cap ?? '').trim() || alt.trim();
    return caption ? `${embed}\n*${caption}*` : embed;
  });
  // bare <img> -> embed
  s = s.replace(/<img src="([^"]+)" alt="[^"]*"[^>]*>/g, (_, src) => `![[${assetName(src)}]]`);
  // markdown images -> embeds
  s = s.replace(/!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)\)/g, (all, alt, src) => (src.includes('.gitbook/assets/') ? `![[${assetName(src)}]]` : all));
  // links to other GitBook pages -> wikilinks
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+\.md)(#[^)]*)?\)/g, (all, text, href, hash) => {
    if (/^https?:/.test(href)) return all;
    const t = titleOf.get(pageKey(href, from));
    return t ? `[[${t}${hash ?? ''}${text !== t ? `|${text}` : ''}]]` : all;
  });
  return s.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

// The first line of most pages is `YEARS - Role` and sometimes `Client: X`; they become frontmatter.
function lift(body) {
  const meta = {};
  let s = body;
  const m = s.match(/^`(\d{4})(?:\s*(?:-|–|&|\/)\s*(\d{4}))?\s+-\s+([^`]+)`[ \t]*\n/m);
  if (m) {
    meta.year = Number(m[1]); if (m[2]) meta.until = Number(m[2]);
    meta.role = m[3].trim().replace(/\s*\\\s*/g, ' / ');
    if (!/^`\d{4}\s*&/.test(m[0])) s = s.replace(m[0], ''); // "2012 & 2017" is two separate years: keep the line as written
  }
  else { const y = s.match(/^`(\d{4}) [^`]*`/m); if (y) meta.year = Number(y[1]); } // "2025 Holiday Season - …": year only, line stays
  const c = s.match(/^`Client: ([^`]+)`[ \t]*\n/m);
  if (c) { meta.client = c[1].trim(); s = s.replace(c[0], ''); }
  return { meta, body: s };
}

// ---------- pages ----------
const summary = fs.readFileSync(path.join(SRC, 'SUMMARY.md'), 'utf8');
const entries = [...summary.matchAll(/^(\s*)\* \[([^\]]+)\]\(([^)]+)\)/gm)].map((m) => ({ title: m[2].replace(/\s+/g, ' ').trim(), file: m[3], key: m[3].replace(/\.md$/, '').replace(/\/README$/, '').replace(/^README$/, '') }));
for (const e of entries) titleOf.set(e.key, e.key.startsWith('concepts/origami/') ? 'Origami' : e.title.replace(/\s*🚀\s*$/, ''));

const written = [];
for (const e of entries) {
  if (e.key === '' || ORIGAMI_PARTS.some((p) => e.key === `concepts/origami/${p}`)) continue;
  const raw = fs.readFileSync(path.join(SRC, e.file), 'utf8');
  const { data: gb, body: gbBody } = splitFrontmatter(raw);
  let body = gbBody.replace(/^\s*# .*\n+/, '').replace(/&#x20;/g, ' ').replace(/[ \t]+$/gm, ''); // the title lives in frontmatter
  const title = titleOf.get(e.key);
  const top = e.key.split('/')[0];
  const section = FEATURED[e.key] ?? top;
  const { meta, body: rest } = lift(body);
  body = convert(rest, e.file);
  const redirect_from = [e.key];
  if (e.key === 'concepts/origami') {
    // merge the sub-pages under one H1 each, below the original intro
    for (const p of ORIGAMI_PARTS) {
      const f = `concepts/origami/${p}.md`;
      const sub = splitFrontmatter(fs.readFileSync(path.join(SRC, f), 'utf8')).body;
      const h = sub.match(/^# (.*)$/m)?.[1].trim() ?? p;
      body += `\n# ${h}\n\n` + convert(sub.replace(/^\s*# .*\n+/, ''), f);
      redirect_from.push(`concepts/origami/${p}`);
    }
  }
  const cover = gb?.cover ? assetName(gb.cover) : null;
  const data = {
    type: 'work', title, section, ...meta,
    ...(STATUS[e.key] ? { status: STATUS[e.key] } : {}),
    ...(FEATURED[e.key] ? { featured: true } : {}),
    ...(gb?.description ? { description: String(gb.description).replace(/\s+/g, ' ').trim() } : {}),
    ...(cover ? { hero: cover } : {}),
    tags: [], publish: true, redirect_from,
  };
  const file = path.join(ROOT, SECTIONS[section], `${title.replace(/[\\/:]/g, '-')}.md`);
  writeNote(file, data, '\n' + body);
  written.push({ key: e.key, file, data });
}

// ---------- home ----------
{
  const { data: gb, body } = splitFrontmatter(fs.readFileSync(path.join(SRC, 'README.md'), 'utf8'));
  const tables = [...body.matchAll(/<table data-view="cards">[\s\S]*?<\/table>/g)].map((m) => m[0]);
  const rows = (t) => [...t.matchAll(/<tr><td>([\s\S]*?)<\/td><td>([\s\S]*?)<\/td><td><a href="([^"]+)">[\s\S]*?<\/a><\/td>(?:<td><a href="([^"]+)">[\s\S]*?<\/a><\/td>)?<\/tr>/g)].map((r) => ({ name: r[1], text: r[2], href: r[3], cover: r[4] }));
  let s = body.replace(/^\s*# .*\n+/, '');
  // first card table: external profiles -> a plain list
  s = s.replace(tables[0], rows(tables[0]).map((r) => `- [${r.name}](${r.href}) — ${r.text}`).join('\n'));
  // second: featured work -> [!cards] callout (the site renders it as the card grid); covers become heroes
  const feat = rows(tables[1]);
  s = s.replace(tables[1], '> [!cards]\n' + feat.map((r) => `> - [[${titleOf.get(pageKey(r.href, 'README.md'))}]]`).join('\n'));
  for (const r of feat) {
    const w = written.find((x) => x.key === pageKey(r.href, 'README.md'));
    if (w && !w.data.hero && r.cover) { w.data.hero = assetName(r.cover); writeNote(w.file, w.data, '\n' + splitFrontmatter(fs.readFileSync(w.file, 'utf8')).body.replace(/^\n/, '')); }
  }
  s = convert(s, 'README.md');
  writeNote(path.join(ROOT, 'Pages', 'Home.md'), { type: 'page', title: 'Welcome', description: String(gb.description).replace(/\s+/g, ' ').trim(), publish: true, redirect_from: [] }, '\n' + s);
}

console.log(`imported ${written.length} works + Pages/Home, ${assets.length} attachments`);
