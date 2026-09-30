import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// Every page lives in src/content/docs/<section>/<slug>/index.md with its images beside it.
// Sections are the folders: work/ and personal/ (titles in src/routeData.ts).
const link = z.union([z.string().url(), z.object({ url: z.string().url(), label: z.string().optional() })]);

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: ({ image }) => z.object({
        /** First year of the work (or the only one). */
        year: z.number().int().min(1990).max(2100).optional(),
        /** Last year, for work that spanned several. */
        until: z.number().int().min(1990).max(2100).optional(),
        /** What you did, e.g. "Lead UI Designer / Art Director". */
        role: z.string().optional(),
        /** Who it was for; blank for personal work. */
        client: z.string().optional(),
        /** complete shows nothing; ongoing with no until shows "2020–". */
        status: z.enum(['concept', 'prototype', 'ongoing', 'complete', 'shelved']).optional(),
        /** Position in the section's menu, lower first. Default: newest year first (2014 counts as 986). */
        order: z.number().optional(),
        /** Cover image for the card and page header, a file in the page's folder: ./photo.jpg (not `hero`, which is Starlight's) */
        cover: image().optional(),
        /** Link buttons under the title, named by host (GitHub, YouTube, Printables…). */
        links: z.array(link).optional(),
        tags: z.array(z.string()).optional(),
        /** Old addresses of this page, without the leading slash; they redirect here. */
        redirect_from: z.array(z.string()).optional(),
        /** Filled in by src/routeData.ts for the theme's page header; not written by hand. */
        clomads: z.any().optional(),
      }),
    }),
  }),
  // The landing page: prose in the body, the card grid from `featured` (page paths like work/routes).
  home: defineCollection({
    loader: glob({ pattern: 'home.md', base: './src/content' }),
    schema: z.object({ title: z.string(), description: z.string().optional(), featured: z.array(z.string()).default([]) }),
  }),
};
