// Markdown conventions for clomads.com pages, on top of standard Markdown:
//   ![|400](./photo.jpg)      a number after | in the alt text is the display width (Astro resizes to it)
//   ![](./photo.jpg)          an image on its own line with an *italic line* right under it is a figure,
//   *The caption*             and the italic line is its caption
//   ![](https://youtu.be/…)   a YouTube link written as an image, on its own line, becomes a player
import { visit, SKIP } from 'unist-util-visit';

const YOUTUBE = /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;

export default function remarkClomads() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      const kids = node.children.filter((c) => !(c.type === 'text' && !c.value.trim()));
      const yt = kids.length === 1 && kids[0].type === 'image' && kids[0].url.match(YOUTUBE);
      if (yt) {
        parent.children[index] = { type: 'html', value: `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="${kids[0].alt || 'YouTube video'}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>` };
        return SKIP;
      }
      for (const img of kids.filter((c) => c.type === 'image')) {
        const m = img.alt?.match(/^(.*?)\|\s*(\d+)\s*$/);
        if (!m) continue;
        img.alt = m[1].trim();
        img.data = { ...img.data, hProperties: { ...img.data?.hProperties, width: Number(m[2]) } };
      }
      if (kids.length === 2 && kids[0].type === 'image' && kids[1].type === 'emphasis') {
        node.data = { ...node.data, hName: 'figure' };
        node.children = [kids[0], { type: 'paragraph', data: { hName: 'figcaption' }, children: kids[1].children }];
      }
    });
  };
}
