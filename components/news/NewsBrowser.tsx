'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Check, Clock, FileText } from 'lucide-react';
import Container from '@/components/ui/Container';
import { articleImageReveal, newsReveal, newsStagger } from '@/lib/animations';
import type { NewsArticle, NewsFilter } from '@/lib/news/types';
import type { PublicListingEmptyState, PublicListingSection } from '@/lib/cms/public-page';
import ListingEmptyState from '@/components/shared/ListingEmptyState';
import {
  availableFilters,
  categoryLabel,
  filterLabel as newsFilterLabel,
  matchesCategory,
  readingTimeLabel,
  sortByLatest,
} from '@/lib/news/helpers';
import NewsCard from './NewsCard';

const GRID_ID = 'news-grid';

function Heading({
  title,
  titleId,
  context,
}: {
  title: string;
  titleId: string;
  context?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2
          id={titleId}
          className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
        >
          {title}
        </h2>
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
        />
      </div>
      {context && (
        <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
          {context}
        </p>
      )}
    </div>
  );
}

/**
 * The category filter, the featured story and the news grid.
 *
 * The featured story is only shown while the filter would include it — under a
 * category it does not belong to, showing it anyway would contradict the filter
 * the reader just chose.
 */
export default function NewsBrowser({
  articles,
  featured,
  initialFilter = 'all',
  browseSection,
  featuredSection,
  latestSection,
  filterLabel = 'Filter news by category',
  filterOptions,
  emptyState,
}: {
  articles: NewsArticle[];
  featured: NewsArticle | null | undefined;
  initialFilter?: NewsFilter;
  browseSection?: PublicListingSection;
  featuredSection?: PublicListingSection;
  latestSection?: PublicListingSection;
  filterLabel?: string;
  filterOptions?: string[];
  emptyState?: PublicListingEmptyState;
}) {
  const browseRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const browseInView = useInView(browseRef, { once: true, margin: '-80px' });
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const [filter, setFilter] = useState<NewsFilter>(initialFilter);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const options = useMemo(() => availableFilters(articles), [articles]);
  const sorted = useMemo(() => sortByLatest(articles), [articles]);
  const visible = useMemo(
    () => sorted.filter((article) => matchesCategory(article, filter)),
    [sorted, filter],
  );

  const showFeatured = !!featured && featuredSection?.enabled !== false && matchesCategory(featured, filter);
  // The featured story has its own block, so it does not repeat in the grid.
  const gridArticles = showFeatured
    ? visible.filter((article) => article.slug !== featured.slug)
    : visible;

  const select = (next: NewsFilter) => {
    setFilter(next);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    select(options[next]);
    buttons.current[next]?.focus();
  };

  return (
    <>
      {/* Browse + featured */}
      {browseSection?.enabled !== false && (
        <section
          ref={browseRef}
          id="browse-news"
          aria-labelledby="browse-news-title"
          className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
        >
          <Container>
            <Heading
              title={browseSection?.title ?? 'Browse News'}
              titleId="browse-news-title"
              context={browseSection?.description ?? 'Real Stories — A Brighter Tomorrow'}
            />

          <div
            role="radiogroup"
            aria-label={filterLabel}
            aria-controls={GRID_ID}
            className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3"
          >
            {options.map((option, index) => {
              const active = option === filter;
              return (
                <button
                  key={option}
                  ref={(node) => {
                    buttons.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => select(option)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      move(index, 1);
                    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      move(index, -1);
                    }
                  }}
                  className={`inline-flex min-h-[44px] items-center gap-2 rounded-[14px] border px-5 font-heading text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-sm ${
                    active
                      ? 'border-rave-red bg-rave-red text-white shadow-[0_0_20px_rgba(255,23,61,0.35)]'
                      : 'border-white/[0.12] bg-white/[0.02] text-rave-muted hover:border-white/30 hover:text-white'
                  }`}
                >
                  {active && <Check aria-hidden className="h-3.5 w-3.5" />}
                  {filterOptions?.[index] || newsFilterLabel(option)}
                </button>
              );
            })}
          </div>

          {showFeatured && featured && (
            <motion.div
              variants={newsStagger}
              initial="hidden"
              animate={browseInView ? 'visible' : 'hidden'}
              className="mt-8 overflow-hidden rounded-[20px] border border-white/[0.08] bg-rave-panel/60"
            >
              <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,420px)_1fr]">
                <motion.div
                  variants={articleImageReveal}
                  className="relative aspect-[16/10] w-full lg:aspect-auto lg:min-h-[320px]"
                >
                  <Image
                    src={(featured.cardImage ?? featured.heroImage).src}
                    alt={(featured.cardImage ?? featured.heroImage).alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 420px"
                    className="object-cover"
                  />
                </motion.div>

                <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
                  <motion.p
                    variants={newsReveal}
                    className="font-heading text-[11px] font-semibold uppercase tracking-[0.26em] text-rave-red sm:text-xs"
                  >
                    {featuredSection?.eyebrow || featuredSection?.title || 'Featured Story'}
                  </motion.p>

                  <motion.h3
                    variants={newsReveal}
                    className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl"
                  >
                    {featured.title}
                  </motion.h3>

                  <motion.p
                    variants={newsReveal}
                    className="max-w-2xl text-sm leading-relaxed text-rave-muted sm:text-base"
                  >
                    {featured.excerpt}
                  </motion.p>

                  <motion.div
                    variants={newsReveal}
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-rave-muted"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FileText aria-hidden className="h-4 w-4 text-rave-red" />
                      {categoryLabel(featured.category)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock aria-hidden className="h-4 w-4 text-rave-red" />
                      {readingTimeLabel(featured)}
                    </span>
                  </motion.div>

                  <motion.div variants={newsReveal} className="pt-1">
                    <Link
                      href={`/news/${featured.slug}`}
                      className="group/cta inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                    >
                      Read Article
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                      />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          </Container>
        </section>
      )}

      {/* Grid */}
      {latestSection?.enabled !== false && (
        <section
          ref={gridRef}
          aria-labelledby="latest-news-title"
          className="relative bg-rave-black pb-16 md:pb-24"
        >
          <Container>
            <Heading
              title={latestSection?.title ?? 'Latest News'}
              titleId="latest-news-title"
              context={latestSection?.description ?? 'All Stories — Same People, Brighter Tomorrow'}
            />

          <p aria-live="polite" className="sr-only">
            {visible.length === 1 ? '1 story shown' : `${visible.length} stories shown`}
          </p>

          {gridArticles.length > 0 ? (
            <motion.div
              id={GRID_ID}
              key={filter}
              variants={newsStagger}
              initial="hidden"
              animate={gridInView ? 'visible' : 'hidden'}
              className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
            >
              {gridArticles.map((article, index) => (
                <NewsCard key={article.slug} article={article} priority={index < 3} />
              ))}
            </motion.div>
          ) : (
            <div
              id={GRID_ID}
              className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
            >
              <ListingEmptyState
                state={emptyState}
                fallbackTitle="New stories are being prepared."
                fallbackDescription="Updates will appear here."
              />
            </div>
          )}
          </Container>
        </section>
      )}
    </>
  );
}
