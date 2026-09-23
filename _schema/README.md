# Vault schemas

Every note whose frontmatter has a `type` matching a file in this folder is checked against it on every push (`npm run check`). Nothing here changes how Obsidian behaves; it only decides what CI accepts.

| type | where the notes live |
|---|---|
| `work` | the folder named after its section; `Inbox/` while unsorted |
| `page` | `Pages/` |

`work.body.md` is the body of new Work notes. `X - Media/Templates/Work.md` is generated from `work.yaml` + `work.body.md` by `npm run build`, so the template and the schema cannot drift.

Section slugs and their titles are in `work.yaml` under `x-sections`. Adding a section there adds it to the template's picker, the validator, and the site menu.
