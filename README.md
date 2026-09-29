# clomads.com

Chloe Madison's portfolio and archive. An Astro + Starlight site on the shared [luna theme](https://github.com/vdbxio/starlight-theme-luna).

**Content is not edited here.** It lives in the private Obsidian vault (`clomads/vault`); on every push to the vault's `main`, CI publishes the notes marked `publish: true` into `src/content/docs/`, `public/attachments/`, and `src/data/`, and pushes here. This repo holds the site's own parts: `astro.config.mjs`, `src/logo.svg`, `src/styles/clomads.css` (brand tokens), and `src/pages/index.astro` (landing page).

The GitBook export that used to live here is on the `main` branch history; this branch (`astro`) replaces it at cutover.

## Local preview

```sh
npm install
npm run build && npm run preview
```
