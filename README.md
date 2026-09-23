# clomads vault

The archive behind clomads.com, kept in git. Every piece of work is one Markdown note; its frontmatter is the record. A validator runs on every push, and whatever is marked `publish: true` becomes the site.

Editing happens in Obsidian. Obsidian Git commits and pushes every 10 minutes. Nobody needs a terminal for day-to-day work.

## Everyday tasks

| I want to… | Do this in Obsidian |
|---|---|
| Add a piece of work | Cmd+P → **Templater: Create new note from template** → **Work**. Give it a title, pick a section (or *Inbox* to sort later), and a year if you know it. |
| Dump something quickly | Make a new note (it lands in `Inbox/`), paste or drag in the images. Sort it into a section later. Nothing in the Inbox publishes until it has `publish: true` and a section. |
| Put it on the site | Set `publish: true`. Fill `description` (one line for cards and search) and `hero` (the cover image). |
| Feature it on the home page | `featured: true`, then add it to the `[!cards]` callout in `Pages/Home`. |
| Keep something private inside a public note | Put it in a `> [!internal]` callout or between `%% %%`. It never publishes. |
| Add a caption | Put an *italic line* directly under an image. |
| Embed a video | `![](https://www.youtube.com/watch?v=…)` on its own line. It plays in Obsidian and on the site. |
| Add links or downloads | `links:` takes URLs (buttons are named by host: GitHub, YouTube, Printables…). `files:` takes filenames from `X - Media/Attachments`. |

Things you don't do: edit `X - Media/Templates/Work.md` (generated from the schema), or switch git branches from Obsidian Git. Stay on `main`.

## Fields

| field | what it is |
|---|---|
| `title` | as it reads on the site |
| `section` | `design-web-and-film`, `personal-projects`, `concepts`, `collections` (folder = section title) |
| `year`, `until` | first and last year; `until` blank for a single year. `status: ongoing` shows "2020–" |
| `role`, `client` | shown in the page header: *2014 · Lead UI Designer · for Nextwave* |
| `status` | `concept`, `prototype`, `ongoing`, `complete`, `shelved` (optional; complete shows nothing) |
| `featured`, `order` | home-page card; menu position (default newest first) |
| `description`, `hero`, `links`, `files`, `tags` | card line, cover image, buttons, downloads, free-form tags |
| `publish` | `true` puts it on the site |

The full rules are in `_schema/work.yaml`. `redirect_from` (hidden in the template) holds old GitBook paths so links to the old site keep working.

## What's where

```
Design, Web & Film/     one note per piece, by section
Personal Projects/
Concepts/
Collections/
Inbox/                  unsorted dumps (new notes land here)
Pages/                  Home (landing page copy), later About, 404
X - Media/Attachments/  every image and file
X - Media/Templates/    Work template (generated)
_schema/                what a note must contain
scripts/                validator, template generator, publish step (CI runs these)
```

## What CI does

On every push: `npm run build` (regenerates the template), commit anything it generated, `npm run check`. On `main` it then runs `npm run publish` into the site repo (`clomads/portfolio`), which builds and deploys clomads.com.

Locally: `npm install`, then `npm run check`, or `npm run publish -- --out ../portfolio` to preview the site.

## History

- **2026-09-23.** Vault created. Schema, validator, and Work template. The GitBook portfolio (26 pages) imported into 17 notes plus Home: Origami's five sub-pages merged into one note, the Featured section folded into real sections with `featured: true`. All 50 GitBook assets kept in Attachments (PSDs, AI, PDF in Git LFS). Site rebuilt on Astro + Starlight with the shared luna theme, on the `astro` branch of `clomads/portfolio`.
