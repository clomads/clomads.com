// Live preview: runs the site's dev server and re-publishes into it whenever a note or attachment changes.
// Usage: node scripts/watch.mjs --out ../portfolio   (npm run watch), then open http://127.0.0.1:4332/
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const OUT = path.resolve(ROOT, args[args.indexOf('--out') + 1]);
// The menu and redirects are read by astro.config.mjs, which the dev server only loads at start. When they
// change the dev server is stopped and started again (Astro's own config-reload restart stops watching content).
const CONFIG_DATA = ['sidebar.json', 'redirects.json'].map((f) => path.join(OUT, 'src', 'data', f));
const snapshot = () => CONFIG_DATA.map((f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '')).join('\0');
let lastConfig = snapshot();
const IGNORE = /(^|\/)(\.git|\.obsidian|node_modules|\.trash|scripts|_schema)(\/|$)/;
let timer = null, running = false, again = false;

const ASTRO = path.join(OUT, 'node_modules', '.bin', 'astro');
const DEV_ARGS = ['dev', '--port', '4332', '--host', '127.0.0.1'];
function startDev() {
  spawnSync(ASTRO, ['dev', 'stop'], { cwd: OUT, stdio: 'ignore' });   // a dev server left running from earlier
  spawn(ASTRO, DEV_ARGS, { cwd: OUT, stdio: 'inherit' });
}
process.on('SIGINT', () => { spawnSync(ASTRO, ['dev', 'stop'], { cwd: OUT, stdio: 'ignore' }); process.exit(0); });

function publish() {
  if (running) { again = true; return; }
  running = true;
  const t = Date.now();
  const p = spawn(process.execPath, [path.join(ROOT, 'scripts', 'publish.mjs'), ...args], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
  let out = ''; p.stdout.on('data', (d) => { out += d; });
  p.on('close', (code) => {
    const last = out.trim().split('\n').filter((l) => /^(published|problem|warning)/.test(l));
    console.log(`[${new Date().toLocaleTimeString()}] ${code ? 'publish failed' : 'published'} in ${Date.now() - t} ms${last.length ? '\n  ' + last.join('\n  ') : ''}`);
    const now = snapshot();
    if (now !== lastConfig) {
      lastConfig = now;
      console.log('  menu or redirects changed: restarting the dev server');
      startDev();
    }
    running = false;
    if (again) { again = false; publish(); }
  });
}

// One watcher per folder rather than fs.watch's recursive mode, which on Linux loses track of a file once an
// editor saves it atomically (write a temp file, rename it over the original). Folders created later are picked up.
const watched = new Map();
function onChange(dir, name) {
  const file = path.relative(ROOT, path.join(dir, name ?? ''));
  if (IGNORE.test(file) || file.endsWith('~')) return;
  if (name && !watched.has(path.join(dir, name))) try { if (fs.statSync(path.join(dir, name)).isDirectory()) watchTree(path.join(dir, name)); } catch {}
  clearTimeout(timer); timer = setTimeout(publish, 300);
}
function watchTree(dir) {
  if (IGNORE.test(path.relative(ROOT, dir)) || watched.has(dir)) return;
  const w = fs.watch(dir, (_, name) => onChange(dir, name));
  w.on('error', () => { w.close(); watched.delete(dir); });
  watched.set(dir, w);
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) if (ent.isDirectory()) watchTree(path.join(dir, ent.name));
}
watchTree(ROOT);
console.log('watching the vault; edits publish on save');
publish();
startDev();
