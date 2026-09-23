import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { productSchema } from 'starlight-theme-luna/schema';

// Extra frontmatter written by the vault's publish step: the theme's header block, with our types and statuses.
const clomads = productSchema.extend({
  type: z.enum(['work', 'page']),
  status: z.enum(['concept', 'prototype', 'ongoing', 'shelved']).optional(),
}).optional();

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema({ extend: z.object({ clomads }) }) }),
};
