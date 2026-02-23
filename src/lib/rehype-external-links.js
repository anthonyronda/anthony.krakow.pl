/**
 * Rehype plugin: auto-wraps external links with the same HTML structure
 * that ExternalLink.astro produces, so link-counter.js can track them.
 *
 * Transforms:
 *   <a href="https://...">text</a>
 * into:
 *   <span class="external-link-wrap">
 *     <a href="https://..." target="_blank" rel="noopener noreferrer"
 *        class="external-link" data-track-url="https://...">text</a>
 *     <span class="click-badge" data-url="https://..." data-initial="0"></span>
 *   </span>
 */

import { visit } from 'unist-util-visit';

const SITE_ORIGIN = 'anthony.krakow.pl';

export function rehypeExternalLinks() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'a') return;

      const href = node.properties?.href;
      if (typeof href !== 'string') return;

      // Only process absolute external URLs
      if (!href.startsWith('http')) return;
      try {
        const url = new URL(href);
        if (url.hostname === SITE_ORIGIN || url.hostname.endsWith(`.${SITE_ORIGIN}`)) return;
      } catch {
        return;
      }

      // Add attributes to the <a>
      node.properties = {
        ...node.properties,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: [node.properties.class, 'external-link'].filter(Boolean).join(' '),
        'data-track-url': href,
      };

      // Wrap in <span class="external-link-wrap"> with a badge sibling
      const badge = {
        type: 'element',
        tagName: 'span',
        properties: {
          class: 'click-badge',
          'data-url': href,
          'data-initial': '0',
        },
        children: [],
      };

      const wrapper = {
        type: 'element',
        tagName: 'span',
        properties: { class: 'external-link-wrap' },
        children: [node, badge],
      };

      parent.children.splice(index, 1, wrapper);
    });
  };
}
