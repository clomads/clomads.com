// Live preview helper: re-runs the publish step whenever a note or attachment changes.
// Usage: node scripts/watch.mjs --out ../portfolio   (run the site's `npm run dev` alongside it)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const IGNORE = /(^|\/)(\.git|\.obsidian|node_modules|\.trash|scripts|_schema)(\/|$)/;
let timer = null, running = false, again = false;

function publish() {
  if (running) { again = true; return; }
  running = true;
  const t = Date.now();
  const p = spawn(process.execPath, [path.join(ROOT, 'scripts', 'publish.mjs'), ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  let out = ''; p.stdout.on('data', (d) => { out += d; });
  p.on('close', (code) => {
    const last = out.trim().split('\n').filter((l) => /^(published|problem|warning)/.test(l));
    console.log(`[${new Date().toLocaleTimeString()}] ${code ? 'publish failed' : 'published'} in ${Date.now() - t} ms${last.length ? '\n  ' + last.join('\n  ') : ''}`);
    running = false;
    if (again) { again = false; publish(); }
  });
}

fs.watch(ROOT, { recursive: true }, (_, file) => {
  if (!file || IGNORE.test(file) || file.endsWith('~')) return;
  clearTimeout(timer); timer = setTimeout(publish, 300);
});
console.log('watching the vault; edits publish on save');
publish();
