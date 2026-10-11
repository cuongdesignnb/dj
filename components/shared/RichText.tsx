import Markdown, { type Components } from 'react-markdown';

/**
 * Renders long-form CMS copy written with the admin rich text editor: a small
 * Markdown subset (paragraphs, line breaks, bold, italic, links, lists, small
 * headings). Plain strings from before the editor render as paragraphs.
 *
 * Safety: Markdown becomes React elements, never HTML. Raw HTML in the source
 * is dropped (`skipHtml`), only the elements below are allowed, and
 * react-markdown's default URL transform removes unsafe link protocols.
 */
const ALLOWED_ELEMENTS = ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const heading = 'mt-1 font-heading text-lg font-semibold uppercase tracking-wide text-white';

const components: Components = {
  p: ({ children }) => <p>{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => {
    const external = typeof href === 'string' && /^https?:\/\//i.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="text-white underline decoration-rave-red/70 underline-offset-[3px] transition-colors hover:decoration-rave-red"
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className="list-disc space-y-1 pl-5 marker:text-rave-red">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5 marker:text-rave-muted">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  // Copy blocks never outrank the page's own headings.
  h1: ({ children }) => <h3 className={heading}>{children}</h3>,
  h2: ({ children }) => <h3 className={heading}>{children}</h3>,
  h3: ({ children }) => <h3 className={heading}>{children}</h3>,
  h4: ({ children }) => <h4 className="font-semibold text-white">{children}</h4>,
  h5: ({ children }) => <h4 className="font-semibold text-white">{children}</h4>,
  h6: ({ children }) => <h4 className="font-semibold text-white">{children}</h4>,
};

export default function RichText({ text, className = '' }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={`space-y-3 ${className}`.trim()} data-rich-text="">
      <Markdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed skipHtml components={components}>
        {text}
      </Markdown>
    </div>
  );
}
