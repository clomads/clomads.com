// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import luna from 'starlight-theme-luna';
import remarkBase from 'starlight-theme-luna/remark-base';
import remarkClomads from './src/lib/remark-clomads.mjs';
import { contentRedirects } from './src/lib/redirects.mjs';

const BASE = (process.env.SITE_BASE ?? '/').replace(/\/$/, '');

// SITE_URL / SITE_BASE let the same build serve a GitHub Pages preview (…github.io/clomads.com/) and clomads.com.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://clomads.com',
  base: process.env.SITE_BASE ?? '/',
  trailingSlash: 'always',
  redirects: contentRedirects(new URL('./src/content/docs/', import.meta.url).pathname),
  markdown: { remarkPlugins: [remarkClomads, [remarkBase, { base: BASE }]] },
  integrations: [
    starlight({
      title: 'Chloe Madison',
      description: 'A living portfolio in wiki form: design, web, film, and open hardware by @clomads.',
      customCss: ['./src/styles/clomads.css'],
      favicon: '/favicon.svg',
      head: [
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '64x64', href: `${BASE}/favicon.png` } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: `${BASE}/apple-touch-icon.png` } },
      ],
      plugins: [
        // The layout (rail, mobile nav, TOC bar, page headers, link buttons) lives in the shared theme.
        luna({
          logo: './src/logo.svg',
          footer: ['clomads.com', 'Chloe Madison', 'Joshua Tree, CA'],
          frontmatterKey: 'clomads',
          headerTypes: ['work'],
          openSections: true,
          statusLabels: { concept: 'Concept', ongoing: 'Ongoing', shelved: 'Shelved' },
        }),
        starlightLlmsTxt(),
      ],
      // the rail menu is built from the pages in src/routeData.ts, so it follows edits without a restart
      routeMiddleware: './src/routeData.ts',
      // the title is the page's H1; sections are ## and below
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/clomads' },
        { icon: 'blueSky', label: 'Bluesky', href: 'https://clomads.bsky.social' },
        { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/clomads' },
      ],
    }),
  ],
});
