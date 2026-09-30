# clomads.com

Chloe Madison's portfolio and archive: an Astro + Starlight site on the shared [luna theme](https://github.com/vdbxio/starlight-theme-luna). The content lives right here and is edited in VS Code.

## Editing

```sh
npm install
npm run dev        # live preview at http://127.0.0.1:4332/, updates on every save
```

Every page is a folder with an `index.md` and its images:

```
src/content/
  home.md                          the landing page: intro text + the featured card list
  docs/work/routes/index.md        one folder per page; the folder name is the address (/work/routes/)
  docs/work/routes/routes-hero.jpg images sit beside the page that uses them
  docs/personal/…
```

| I want to… | Do this |
|---|---|
| Add a page | Front Matter panel → **Create content** → Work or Personal. Or copy a folder and edit it. |
| Keep it off the live site | `draft: true`. Drafts still show in the local preview, marked "· draft" in the menu. |
| Add an image | Paste or drop it into the page in VS Code; it's saved next to `index.md`. Written as `![](./photo.jpg)`. |
| Set an image's width | `![|400](./photo.jpg)`; the site resizes it to 400 px. |
| Caption an image | Put an *italic line* directly under it. |
| Embed a video | `![](https://www.youtube.com/watch?v=…)` on its own line. |
| Add a callout | `:::note` … `:::` (also `tip`, `caution`, `danger`). |
| Feature a page on the home page | Add its path (`work/routes`) to `featured:` in `src/content/home.md`. |
| Move or rename a page | Move or rename its folder, and add the old path to `redirect_from:` so old links keep working. |
| Reorder the menu | `order:` (lower first). Without it, newest `year` first. |

The page title is the H1, so sections inside a page start at `##`.

## Frontmatter

| field | what it is |
|---|---|
| `title`, `description` | page title; one line for cards and search |
| `year`, `until` | first and last year; shown as "2015–2017" (or "2020–" when `status: ongoing`) |
| `role`, `client` | shown under the title: *2014 · Lead UI Designer · for Nextwave* |
| `status` | `concept`, `prototype`, `ongoing`, `complete`, `shelved` (complete shows nothing) |
| `order` | menu position, lower first |
| `cover` | cover image in the page's folder (`./photo.jpg`), used on cards and in the page header |
| `links` | URLs shown as buttons, named by host |
| `tags`, `draft`, `redirect_from` | free-form tags; keep off the live site; old addresses |

The rules are in `src/content.config.ts`; the dev server and the Astro extension flag anything that breaks them. The Front Matter CMS extension reads the same fields from `frontmatter.json`.

## How it's put together

- `src/routeData.ts` builds the rail menu from the pages and fills in the page header.
- `src/lib/remark-clomads.mjs` handles image widths, captions, and YouTube embeds.
- `src/lib/redirects.mjs` turns each page's `redirect_from` into a redirect.
- `src/pages/index.astro` is the landing page; `src/styles/clomads.css` holds the brand tokens; `src/logo.svg` is the logo.

Pushes to `main` build and deploy with GitHub Pages (`.github/workflows/pages.yml`).

## History

- Until 2026: a GitBook site, synced here. That history is on the `gitbook` branch.
- 2026-09-23: rebuilt on Astro, fed from a separate Obsidian vault.
- 2026-09-29: the vault's content and history were folded into this repo and converted to plain Markdown (`scripts/migrations/2026-09-29-vault-to-content.mjs`); content is now edited here directly.
