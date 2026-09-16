'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import { newsStagger } from '@/lib/animations';
import type { NewsArticle } from '@/lib/news/types';
import NewsCard from './NewsCard';

/** Related stories. Renders nothing when there are none. */
export default function RelatedStories({ articles }: { articles: NewsArticle[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (articles.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="related-stories-title"
      className="relative bg-rave-black py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="related-stories-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              Related Stories
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
            Real Stories <span aria-hidden className="text-rave-red">&mdash;</span> A Brighter
            Tomorrow
          </p>
        </div>

        <motion.div
          variants={newsStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {articles.map((article) => (
            <NewsCard key={article.slug} article={article} />
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
