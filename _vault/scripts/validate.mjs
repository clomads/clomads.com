// Validates every typed note against _schema/. Exit 1 on any error.
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { ROOT, walk, rel, readNote, loadSchemas } from './lib.mjs';
import { derived } from './build.mjs';

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

const schemas = loadSchemas();
const ajv = new Ajv({ allErrors: true, strict: false });
const validators = Object.fromEntries(Object.entries(schemas).filter(([, s]) => s.type === 'object').map(([k, s]) => [k, ajv.compile(s)]));
const SECTIONS = schemas.work['x-sections'];
const ATTACHMENTS = path.join(ROOT, 'X - Media', 'Attachments');

// 1. Collect typed notes (templates are scaffolds, not records)
const notes = { work: [], page: [] };
const templatesDir = (() => {
  try { return path.join(ROOT, JSON.parse(fs.readFileSync(path.join(ROOT, '.obsidian', 'templates.json'), 'utf8')).folder); }
  catch { return null; }
})();
for (const file of walk()) {
  if (!file.endsWith('.md')) continue;
  if (templatesDir && file.startsWith(templatesDir + path.sep)) continue;
  const note = readNote(file);
  if (note.error) { err(note.rel, `frontmatter does not parse: ${note.error}`); continue; }
  const t = note.data?.type;
  if (typeof t !== 'string' || !(t in validators)) continue;
  // Obsidian writes an empty property as null; treat that as "not set"
  note.data = Object.fromEntries(Object.entries(note.data).filter(([, v]) => v !== null && v !== ''));
  if (!validators[t](note.data)) for (const e of validators[t].errors) err(note.rel, `${e.instancePath || '/'} ${e.message}`);
  notes[t].push(note);
}

const found = (note, p) => fs.existsSync(path.resolve(path.dirname(note.file), p)) || fs.existsSync(path.join(ROOT, p)) || fs.existsSync(path.join(ATTACHMENTS, path.basename(p)));

// 2. Work rules
const titles = new Map();
for (const w of notes.work) {
  const d = w.data;
  if (d.publish && !d.section) err(w.rel, 'publish is true but section is empty');
  if (d.until && d.year && d.until < d.year) err(w.rel, `until ${d.until} is before year ${d.year}`);
  if (d.until && !d.year) err(w.rel, 'until needs a year');
  const folder = w.rel.split(path.sep)[0];
  if (d.section && folder !== SECTIONS[d.section]) warn(w.rel, `section ${d.section} but lives in "${folder}/"; move it to "${SECTIONS[d.section]}/"`);
  if (d.hero && !found(w, d.hero)) err(w.rel, `hero image not found: ${d.hero}`);
  for (const f of d.files ?? []) { const p = typeof f === 'string' ? f : f.path; if (!found(w, p)) err(w.rel, `files entry not found: ${p}`); }
  const key = d.title.toLowerCase();
  if (titles.has(key)) warn(w.rel, `same title as ${titles.get(key)}`); else titles.set(key, w.rel);
}
for (const pg of notes.page) if (pg.data.hero && !found(pg, pg.data.hero)) err(pg.rel, `hero image not found: ${pg.data.hero}`);

// 3. Old addresses are claimed once
const seenRedirect = new Map();
for (const n of [...notes.work, ...notes.page]) for (const r of n.data.redirect_from ?? []) {
  if (seenRedirect.has(r)) err(n.rel, `redirect_from ${r} is also claimed by ${seenRedirect.get(r)}`); else seenRedirect.set(r, n.rel);
}

// 4. Generated files are fresh
for (const { file, content } of derived().files) {
  if (!fs.existsSync(file)) err(rel(file), 'missing generated file, run npm run build');
  else if (fs.readFileSync(file, 'utf8') !== content) err(rel(file), 'stale generated file, run npm run build');
}

for (const w of warnings) console.log('warn  ' + w);
for (const e of errors) console.log('error ' + e);
const pub = notes.work.filter(w => w.data.publish).length;
console.log(`\nchecked ${notes.work.length} works (${pub} published), ${notes.page.length} pages; ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
process.exit(errors.length ? 1 : 0);
