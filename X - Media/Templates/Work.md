<%*
// Work scaffold. Run "Templater: Create new note from template" and pick this file.
const given = tp.file.title.startsWith("Untitled") ? "" : tp.file.title;
const title = ((await tp.system.prompt("Title", given)) ?? given).trim() || "Untitled work";
const sections = {"work":"Work","personal":"Personal"};
const section = (await tp.system.suggester(["Inbox (sort later)", ...Object.values(sections)], ["", ...Object.keys(sections)], false, "Section")) ?? "";
const y = ((await tp.system.prompt("Year (blank if unsure)", "")) ?? "").trim();
const year = /^\d{4}$/.test(y) ? y : "";
const folder = section ? sections[section] : "Inbox";
if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);
await tp.file.move(`${folder}/${title.replace(/[\\/:]/g, "-")}`);
-%>
---
type: work
title: <% JSON.stringify(title) %>
section: <% section %>
year: <% year %>
until:
role:
client:
status:
featured:
order:
description:
hero:
links: []
files: []
tags: []
publish: false
---

# Summary

> [!internal]
> Anything in an internal callout stays in the vault: rates, contacts, what you'd do differently.

# Process

# Result
