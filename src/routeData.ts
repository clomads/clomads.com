// Runs for every Starlight page: builds the rail menu from the pages themselves (so adding, moving, or
// reordering a page needs no restart) and fills in the block the theme's page header reads.
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

export const SECTIONS = { work: 'Work', personal: 'Personal' } as const;
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
const unbase = (src: string) => (base && src.startsWith(base + '/') ? src.slice(base.length) : src);

export const orderOf = (d: { data: { order?: number; year?: number } }) => d.data.order ?? (d.data.year ? 3000 - d.data.year : 2000);
export const years = (d: { year?: number; until?: number; status?: string }) =>
  d.year ? `${d.year}${d.until && d.until !== d.year ? `–${d.until}` : d.status === 'ongoing' ? '–' : ''}` : undefined;

export const onRequest = defineRouteMiddleware(async (context) => {
  const route = context.locals.starlightRoute;
  const current = route.entry.id;
  const pages = (await getCollection('docs')).filter((p) => !(import.meta.env.PROD && p.data.draft));

  route.sidebar = Object.entries(SECTIONS).map(([sec, label]) => ({
    type: 'group' as const, label, collapsed: false, badge: undefined,
    entries: pages.filter((p) => p.id.startsWith(`${sec}/`))
      .sort((a, b) => orderOf(a) - orderOf(b) || a.data.title.localeCompare(b.data.title))
      .map((p) => ({ type: 'link' as const, label: p.data.title + (p.data.draft ? ' · draft' : ''), href: `${base}/${p.id}/`, isCurrent: p.id === current, badge: undefined, attrs: {} })),
  })).filter((g) => g.entries.length);

  const d = route.entry.data;
  if (!(route.entry.id.split('/')[0] in SECTIONS)) return;
  const meta = [years(d), d.role, d.client && `for ${d.client}`].filter(Boolean);
  let hero: string | undefined;
  if (d.cover) {
    // the header shows the cover unless the page already shows the same image in its body
    const name = d.cover.src.split('/').pop()!.split(/[.?]/)[0];
    if (!route.entry.body?.includes(`./${name}.`)) hero = unbase((await getImage({ src: d.cover, width: 1600 })).src);
  }
  d.clomads = {
    type: 'work',
    ...(meta.length ? { meta } : {}),
    ...(d.status && d.status !== 'complete' ? { status: d.status } : {}),
    ...(hero ? { hero } : {}),
    ...(d.links?.length ? { links: d.links.map((l: any) => (typeof l === 'string' ? { url: l } : l)) } : {}),
  };
});
