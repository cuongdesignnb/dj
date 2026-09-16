import Image from 'next/image';
import type { ArticleContentBlock } from '@/lib/news/types';

/**
 * Renders an article from structured blocks.
 *
 * A Server Component with no motion, so the prose is in the initial HTML for
 * search engines and for anyone without JavaScript. Every block type maps to a
 * component here — `dangerouslySetInnerHTML` is never used, so there is no path
 * for CMS markup to execute.
 */
export default function ArticleBody({ blocks }: { blocks: ArticleContentBlock[] }) {
  if (blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            return block.level === 3 ? (
              <h3
                key={block.id}
                className="mt-2 font-heading text-xl font-bold uppercase tracking-[0.04em] text-white sm:text-2xl"
              >
                {block.text}
              </h3>
            ) : (
              <h2
                key={block.id}
                className="mt-2 font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-3xl"
              >
                {block.text}
              </h2>
            );

          case 'paragraph':
            return (
              <p key={block.id} className="text-base leading-relaxed text-rave-muted">
                {block.text}
              </p>
            );

          case 'image':
            return (
              <figure key={block.id} className="my-2">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[16px] border border-white/[0.08]">
                  <Image
                    src={block.image.src}
                    alt={block.image.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 700px"
                    className="object-cover"
                  />
                </div>
                {block.image.caption && (
                  <figcaption className="mt-2 text-sm text-rave-muted/80">
                    {block.image.caption}
                  </figcaption>
                )}
              </figure>
            );

          case 'quote':
            return (
              <figure
                key={block.id}
                className="my-2 border-l-2 border-rave-red pl-5 sm:pl-6"
              >
                <blockquote className="text-lg italic leading-relaxed text-white sm:text-xl">
                  <span aria-hidden className="mr-1 text-rave-red">
                    &ldquo;
                  </span>
                  {block.text}
                  <span aria-hidden className="ml-1 text-rave-red">
                    &rdquo;
                  </span>
                </blockquote>
                {/* Only rendered when someone is actually on record. */}
                {block.attribution && (
                  <figcaption className="mt-3 font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted">
                    &mdash; {block.attribution}
                  </figcaption>
                )}
              </figure>
            );

          case 'list':
            return block.style === 'numbered' ? (
              <ol
                key={block.id}
                className="ml-5 flex list-decimal flex-col gap-2 text-base leading-relaxed text-rave-muted marker:text-rave-red"
              >
                {block.items.map((item, index) => (
                  <li key={`${block.id}-${index}`}>{item}</li>
                ))}
              </ol>
            ) : (
              <ul
                key={block.id}
                className="ml-5 flex list-disc flex-col gap-2 text-base leading-relaxed text-rave-muted marker:text-rave-red"
              >
                {block.items.map((item, index) => (
                  <li key={`${block.id}-${index}`}>{item}</li>
                ))}
              </ul>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
