/**
 * Long-form CMS copy is stored as a small Markdown subset (paragraphs, line
 * breaks, bold, italic, links, lists, small headings) written by the admin rich
 * text editor. Plain strings written before the editor existed are valid input.
 *
 * Meta descriptions, Open Graph/Twitter text, JSON-LD, counters and clamped
 * previews need the visible text only, without Markdown syntax.
 */
export function richTextToPlain(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .replace(/\r\n?/g, '\n')
    // Images and links keep their visible text.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Block markers at the start of a line: headings, quotes, list bullets/numbers.
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, '')
    .replace(/^[ \t]*>[ \t]?/gm, '')
    .replace(/^[ \t]*(?:[-*+]|\d{1,3}[.)])[ \t]+/gm, '')
    // Emphasis: only when it wraps text, so "A * B" or snake_case survive.
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/(^|[^\w*])\*(?=\S)([^*\n]*?\S)\*(?![\w*])/g, '$1$2')
    .replace(/(^|[^\w_])_(?=\S)([^_\n]*?\S)_(?![\w_])/g, '$1$2')
    // Backslash escapes and hard-break markers.
    .replace(/\\([\\`*_{}[\]()#+\-.!>~|])/g, '$1')
    .replace(/\\\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain text cut to `max` characters at a word boundary, for meta descriptions. */
export function richTextExcerpt(value: string | null | undefined, max = 160): string {
  const plain = richTextToPlain(value);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
