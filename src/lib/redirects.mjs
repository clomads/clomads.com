// Old addresses from each page's `redirect_from`, read straight from the content files at config time.
// An old sub-page address whose last part matches a heading on the page lands on that heading
// (concepts/origami/keyboard -> /personal/origami/#keyboard).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const anchor = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');
const loose = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-and-/g, '-').replace(/^-|-$/g, '');

export function contentRedirects(docsDir) {
  const out = {};
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, ent.name);
      if (ent.isDirectory()) { walk(f); continue; }
      if (ent.name !== 'index.md' && ent.name !== 'index.mdx') continue;
      const raw = fs.readFileSync(f, 'utf8');
      const m = raw.match(/^---\n([\s\S]*?)\n---/);
      const data = m ? YAML.parse(m[1]) ?? {} : {};
      if (data.draft || !data.redirect_from?.length) continue;
      const id = path.relative(docsDir, path.dirname(f)).split(path.sep).join('/');
      const headings = [...raw.matchAll(/^#{2,6} (.+?)\s*$/gm)].map((h) => h[1]);
      for (const r of data.redirect_from) {
        const from = '/' + r.replace(/^\/+|\/+$/g, '');
        const last = from.split('/').pop();
        const h = from.split('/').length > 2 && last !== id.split('/').pop() ? headings.find((t) => loose(anchor(t)) === loose(last)) : null;
        if (from !== `/${id}`) out[from] = `/${id}/` + (h ? `#${anchor(h)}` : '');
      }
    }
  };
  walk(docsDir);
  return Object.fromEntries(Object.entries(out).sort());
}
