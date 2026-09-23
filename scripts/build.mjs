// Generates everything derived: the Work template (from _schema/work.yaml + work.body.md).
// Run: npm run build. CI runs it and commits the result.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { ROOT, rel, loadSchemas } from './lib.mjs';

export const TEMPLATE_PATH = path.join(ROOT, 'X - Media', 'Templates', 'Work.md');

export function renderWorkTemplate() {
  const schema = loadSchemas().work;
  const defaults = schema['x-template'] ?? {};
  const sections = schema['x-sections'];
  const prompted = { title: '<% JSON.stringify(title) %>', section: '<% section %>', year: '<% year %>' };
  const lines = [];
  for (const [key, def] of Object.entries(schema.properties)) {
    if (def['x-hidden']) continue;
    if (key in prompted) lines.push(`${key}: ${prompted[key]}`);
    else if (key in defaults) lines.push(`${key}: ${YAML.stringify(defaults[key]).trim()}`);
    else if (def.type === 'array') lines.push(`${key}: []`);
    else lines.push(`${key}:`);
  }
  const body = fs.readFileSync(path.join(ROOT, '_schema', 'work.body.md'), 'utf8');
  const head = `<%*
// Work scaffold. Run "Templater: Create new note from template" and pick this file.
const given = tp.file.title.startsWith("Untitled") ? "" : tp.file.title;
const title = ((await tp.system.prompt("Title", given)) ?? given).trim() || "Untitled work";
const sections = ${JSON.stringify(sections)};
const section = (await tp.system.suggester(["Inbox (sort later)", ...Object.values(sections)], ["", ...Object.keys(sections)], false, "Section")) ?? "";
const y = ((await tp.system.prompt("Year (blank if unsure)", "")) ?? "").trim();
const year = /^\\d{4}$/.test(y) ? y : "";
const folder = section ? sections[section] : "Inbox";
if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
await tp.file.move(\`\${folder}/\${title.replace(/[\\\\/:]/g, "-")}\`);
-%>
`;
  return `${head}---\n${lines.join('\n')}\n---\n${body}`;
}

export function derived() {
  return { files: [{ file: TEMPLATE_PATH, content: renderWorkTemplate() }] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const { file, content } of derived().files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (old !== content) { fs.writeFileSync(file, content); console.log(`wrote ${rel(file)}`); }
  }
}
