import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, FileText, Tag } from 'lucide-react';
import type { NewsArticle } from '@/lib/news/types';
import {
  categoryLabel,
  publishedLabel,
  readingTimeLabel,
} from '@/lib/news/helpers';
import ArticleShare from './ArticleShare';

/**
 * Article overview, quick summary, share controls and the latest stories.
 *
 * A Server Component apart from the share control, which is the only part that
 * needs the browser.
 */
export default function ArticleSidebar({
  article,
  latest,
}: {
  article: NewsArticle;
  latest: NewsArticle[];
}) {
  return (
    <aside
      aria-labelledby="article-overview-title"
      className="flex flex-col gap-5 lg:sticky lg:top-[104px]"
    >
      <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
        <h2
          id="article-overview-title"
          className="font-heading text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
        >
          Article Overview
        </h2>
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-14 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
        />

        <dl className="mt-5 flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-rave-muted">
              <FileText aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
              Category
            </dt>
            <dd className="text-right text-white">{categoryLabel(article.category)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-rave-muted">
              <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
              Reading Time
            </dt>
            <dd className="text-right text-white">{readingTimeLabel(article)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-2 text-rave-muted">
              <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
              Published
            </dt>
            {/* Reads "Preview" while the article has no publication date. */}
            <dd className="text-right text-white">{publishedLabel(article)}</dd>
          </div>
          {article.tags.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <dt className="flex items-center gap-2 text-rave-muted">
                <Tag aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                Topics
              </dt>
              <dd className="text-right text-white">{article.tags.join(', ')}</dd>
            </div>
          )}
        </dl>

        {article.quickSummary.length > 0 && (
          <div className="mt-6 border-t border-white/[0.08] pt-5">
            <h3 className="font-heading text-sm font-bold uppercase tracking-[0.2em] text-white">
              Quick Summary
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {article.quickSummary.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm text-rave-muted">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-rave-red bg-rave-red/30"
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-white/[0.08] pt-5">
          <ArticleShare title={article.title} />
        </div>

        <Link
          href={article.eventHref ?? '/event'}
          className="group/cta mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-5 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
        >
          Explore Event
          <ArrowRight
            aria-hidden
            className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
          />
        </Link>
      </div>

      {latest.length > 0 && (
        <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              Latest Stories
            </h2>
            <Link
              href="/news"
              className="group/link inline-flex items-center gap-1.5 font-heading text-xs font-semibold uppercase tracking-wider text-rave-red transition-colors hover:text-rave-red2 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
            >
              View All
              <ArrowRight
                aria-hidden
                className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1"
              />
            </Link>
          </div>

          <ul className="mt-5 flex flex-col gap-4">
            {latest.map((story) => {
              const image = story.cardImage ?? story.heroImage;
              return (
                <li key={story.slug}>
                  <Link
                    href={`/news/${story.slug}`}
                    className="group/story flex gap-3 rounded-[14px] border border-white/[0.06] p-2 transition-colors duration-300 hover:border-rave-red/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                  >
                    <span className="relative block h-[72px] w-[92px] shrink-0 overflow-hidden rounded-[10px]">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        loading="lazy"
                        sizes="92px"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-rave-red">
                        {categoryLabel(story.category)}
                      </span>
                      <span className="mt-1 block font-heading text-sm font-bold uppercase leading-tight text-white">
                        {story.title}
                      </span>
                      <span className="mt-1 block text-xs text-rave-muted">
                        {readingTimeLabel(story)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </aside>
  );
}
