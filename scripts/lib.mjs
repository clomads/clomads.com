import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SKIP_DIRS = new Set(['.git', '.obsidian', 'node_modules', '.trash']);

export function* walk(dir = ROOT) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      yield* walk(path.join(dir, ent.name));
    } else if (ent.isFile()) {
      yield path.join(dir, ent.name);
    }
  }
}

export function rel(file) { return path.relative(ROOT, file); }

export function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: null, body: raw };
  let data;
  try { data = YAML.parse(m[1]) ?? {}; } catch (e) { return { data: null, body: raw, error: e.message }; }
  return { data, body: raw.slice(m[0].length) };
}

export function readNote(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return { file, rel: rel(file), raw, ...splitFrontmatter(raw) };
}

export function stringifyNote(data, body = '') {
  const fm = YAML.stringify(data, { lineWidth: 0 });
  return `---\n${fm}---\n${body}`;
}

export function writeNote(file, data, body = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, stringifyNote(data, body));
}

export function loadSchemas() {
  const dir = path.join(ROOT, '_schema');
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.yaml')) continue;
    out[f.replace(/\.yaml$/, '')] = YAML.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  }
  return out;
}

export function slug(s) {
  return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
