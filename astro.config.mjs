// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import luna from 'starlight-theme-luna';
import remarkBase from 'starlight-theme-luna/remark-base';
import redirects from './src/data/redirects.json' with { type: 'json' };
import sidebar from './src/data/sidebar.json' with { type: 'json' };

const BASE = (process.env.SITE_BASE ?? '/').replace(/\/$/, '');

// SITE_URL / SITE_BASE let the same build serve the GitHub Pages preview (…github.io/portfolio/) and clomads.com.
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://clomads.com',
  base: process.env.SITE_BASE ?? '/',
  trailingSlash: 'always',
  redirects,
  markdown: { remarkPlugins: [[remarkBase, { base: BASE }]] },
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
      sidebar,
      // vault H1/H2/H3 sections publish as H2/H3/H4 (the title is the page's H1); keep all three in the TOC
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 4 },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/clomads' },
        { icon: 'blueSky', label: 'Bluesky', href: 'https://clomads.bsky.social' },
        { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/clomads' },
      ],
    }),
  ],
});
