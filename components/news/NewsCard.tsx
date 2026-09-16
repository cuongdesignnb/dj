'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock } from 'lucide-react';
import type { NewsArticle } from '@/lib/news/types';
import { categoryLabel, readingTimeLabel } from '@/lib/news/helpers';
import { newsReveal } from '@/lib/animations';

/** One story in the news grid. The whole card is a link to its own page. */
export default function NewsCard({
  article,
  priority = false,
}: {
  article: NewsArticle;
  priority?: boolean;
}) {
  const reduced = useReducedMotion();
  const image = article.cardImage ?? article.heroImage;

  return (
    <motion.article variants={newsReveal} className="h-full">
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={reduced ? undefined : 'hover'}
        whileFocus={reduced ? undefined : 'hover'}
        variants={{ rest: { y: 0 }, hover: { y: -6 } }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="group/card h-full"
      >
        <Link
          href={`/news/${article.slug}`}
          className="flex h-full flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-rave-panel/70 transition-[border-color,box-shadow] duration-300 hover:border-rave-red/60 hover:shadow-[0_22px_60px_rgba(255,23,61,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden">
            <motion.div
              variants={{ rest: { scale: 1 }, hover: { scale: reduced ? 1 : 1.035 } }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={priority}
                loading={priority ? undefined : 'lazy'}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </motion.div>
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(3,3,5,0.1) 0%, rgba(3,3,5,0) 55%, rgba(3,3,5,0.55) 100%)',
              }}
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
            <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-rave-red sm:text-[11px]">
              {categoryLabel(article.category)}
            </p>

            <h3 className="font-heading text-xl font-black uppercase leading-[1.1] tracking-tight text-white sm:text-2xl">
              {article.title}
            </h3>

            <p className="text-sm leading-relaxed text-rave-muted">{article.excerpt}</p>

            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
              <span className="inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wider text-rave-red">
                Read Story
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1"
                />
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-rave-muted">
                <Clock aria-hidden className="h-3.5 w-3.5" />
                {readingTimeLabel(article)}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.article>
  );
}
