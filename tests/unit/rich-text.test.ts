import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import RichText from '@/components/shared/RichText';
import { richTextExcerpt, richTextToPlain } from '@/lib/rich-text/plain';
import { buildMetadata } from '@/lib/seo/metadata';
import { eventSchema, faqSchema } from '@/lib/seo/structured-data';

const html = (text: string) => renderToStaticMarkup(createElement(RichText, { text }));

describe('RichText renders the editor subset as safe React elements', () => {
  it('keeps paragraphs, line breaks, emphasis, lists and links', () => {
    const out = html('First **bold** and *italic*.\n\nSecond line\\\nbreak\n\n- one\n- two\n\n1. first\n2. second\n\nSee [tickets](/tickets?event=hi-land-perth) or [site](https://example.com).');
    expect(out).toContain('<p>First <strong class="font-semibold text-white">bold</strong> and <em class="italic">italic</em>.</p>');
    expect(out).toMatch(/<p>Second line<br\/>\s*break<\/p>/);
    expect(out).toMatch(/<ul[^>]*>\s*<li[^>]*>one<\/li>\s*<li[^>]*>two<\/li>\s*<\/ul>/);
    expect(out).toMatch(/<ol[^>]*>/);
    expect(out).toContain('href="/tickets?event=hi-land-perth"');
    expect(out).not.toMatch(/href="\/tickets\?event=hi-land-perth"[^>]*target=/);
    expect(out).toMatch(/href="https:\/\/example\.com" target="_blank" rel="noopener noreferrer"/);
  });

  it('renders legacy plain text unchanged as a paragraph', () => {
    expect(html('Secure your entry to the night.')).toBe('<div class="space-y-3" data-rich-text=""><p>Secure your entry to the night.</p></div>');
    expect(html('')).toBe('');
  });

  it('never renders raw HTML, scripts, unsafe links or page-level headings', () => {
    const out = html('<script>alert(1)</script><img src=x onerror=alert(1)>\n\n[click](javascript:alert(1)) <b>raw</b>\n\n# Big\n\n![pic](https://example.com/x.png)');
    expect(out).not.toMatch(/<script|<img|onerror|<b>|javascript:/i);
    expect(out).not.toContain('<h1');
    expect(out).toContain('<h3');
    expect(out).toContain('click');
  });
});

describe('plain-text projection for SEO and previews', () => {
  it.each([
    ['**Bold** and *italic* with [a link](https://x.test).', 'Bold and italic with a link.'],
    ['### Heading\n\n- one\n- two\n\n1. three', 'Heading one two three'],
    ['Line one\\\nline two', 'Line one line two'],
    ['Music × People * Culture', 'Music × People * Culture'],
    ['snake_case_name stays', 'snake_case_name stays'],
    ['Plain legacy description.', 'Plain legacy description.'],
    ['', ''],
  ])('%j → %j', (input, expected) => {
    expect(richTextToPlain(input)).toBe(expected);
  });

  it('cuts excerpts at a word boundary', () => {
    expect(richTextExcerpt('**word** '.repeat(40), 40)).toMatch(/^word( word)*…$/);
    expect(richTextExcerpt('short', 40)).toBe('short');
  });

  it('meta tags and JSON-LD never carry formatting marks', () => {
    const metadata = buildMetadata({ title: 'X', description: 'A **great** night at [Perth](/events/perth).', path: '/x' });
    expect(metadata.description).toBe('A great night at Perth.');
    expect(metadata.openGraph?.description).toBe('A great night at Perth.');
    expect(eventSchema({ name: 'E', path: '/events/e', startDate: '2026-12-31T10:00:00Z', description: '- **one**\n- two' })?.description).toBe('one two');
    const faq = faqSchema([{ question: 'Q?', answer: 'Bring **ID**.', published: true, answersConfirmed: true }]) as { mainEntity: Array<{ acceptedAnswer: { text: string } }> };
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe('Bring ID.');
  });
});
