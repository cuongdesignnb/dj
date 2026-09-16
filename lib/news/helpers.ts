import type {
  ArticleContentBlock,
  NewsArticle,
  NewsCategory,
  NewsFilter,
} from './types';

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  announcements: 'Announcements',
  'event-updates': 'Event Updates',
  'artist-stories': 'Artist Stories',
  community: 'Community',
  press: 'Press',
};

export const NEWS_FILTERS: NewsFilter[] = [
  'all',
  'announcements',
  'event-updates',
  'artist-stories',
  'community',
  'press',
];

export function categoryLabel(category: NewsCategory): string {
  return CATEGORY_LABELS[category];
}

export function filterLabel(filter: NewsFilter): string {
  return filter === 'all' ? 'All' : CATEGORY_LABELS[filter];
}

export function matchesCategory(article: NewsArticle, filter: NewsFilter): boolean {
  return filter === 'all' || article.category === filter;
}

/** Only offers filters that actually have articles behind them. */
export function availableFilters(articles: NewsArticle[]): NewsFilter[] {
  return NEWS_FILTERS.filter(
    (filter) => filter === 'all' || articles.some((article) => article.category === filter),
  );
}

export function parseNewsFilter(value: string | string[] | undefined): NewsFilter {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return NEWS_FILTERS.includes(raw as NewsFilter) ? (raw as NewsFilter) : 'all';
}

const WORDS_PER_MINUTE = 200;

function blockWordCount(block: ArticleContentBlock): number {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return block.text.trim().split(/\s+/).filter(Boolean).length;
    case 'quote':
      return block.text.trim().split(/\s+/).filter(Boolean).length;
    case 'list':
      return block.items.join(' ').trim().split(/\s+/).filter(Boolean).length;
    case 'image':
      // An image costs a reader a few seconds of attention.
      return 40;
    default:
      return 0;
  }
}

/** Estimated minutes, never below one. */
export function estimateReadingTime(blocks: ArticleContentBlock[]): number {
  const words = blocks.reduce((sum, block) => sum + blockWordCount(block), 0);
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** The CMS override wins; otherwise the body is measured. */
export function readingTime(article: NewsArticle): number {
  if (typeof article.readingTimeMinutes === 'number' && article.readingTimeMinutes > 0) {
    return article.readingTimeMinutes;
  }
  return estimateReadingTime(article.body);
}

export function readingTimeLabel(article: NewsArticle): string {
  return `${readingTime(article)} min read`;
}

/**
 * Publication label.
 *
 * A preview article has no date to show, and one is never invented for it.
 * Formatting is fixed to en-AU with an explicit UTC zone so the server and the
 * client render the same string.
 */
export function publishedLabel(article: NewsArticle): string {
  if (article.status !== 'published' || !article.publishedAt) return 'Preview';
  const parsed = new Date(article.publishedAt);
  if (Number.isNaN(parsed.getTime())) return 'Preview';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function statusLabel(article: NewsArticle): string {
  switch (article.status) {
    case 'published':
      return 'Published';
    case 'archived':
      return 'Archived';
    case 'draft':
      return 'Draft';
    case 'preview':
    default:
      return 'Article Preview';
  }
}

/**
 * Newest first for published articles; preview articles have no date, so they
 * keep their declared order. Deterministic either way — a random ordering would
 * differ between server and client and break hydration.
 */
export function sortByLatest(articles: NewsArticle[]): NewsArticle[] {
  return [...articles].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : NaN;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : NaN;
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

export function latestStories(
  all: NewsArticle[],
  current: NewsArticle,
  limit = 3,
): NewsArticle[] {
  return sortByLatest(all.filter((article) => article.slug !== current.slug)).slice(0, limit);
}

/**
 * Related articles: shared tags first, then same category, then latest.
 * Deterministic, and never the article being read.
 */
export function relatedStories(
  all: NewsArticle[],
  current: NewsArticle,
  limit = 3,
): NewsArticle[] {
  const others = all.filter((article) => article.slug !== current.slug);
  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));

  const scored = others.map((article) => {
    const shared = article.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length;
    const sameCategory = article.category === current.category ? 1 : 0;
    return { article, score: shared * 2 + sameCategory };
  });

  // Stable: equal scores keep source order.
  const ordered = scored
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => (b.score - a.score) || (a.index - b.index))
    .map((entry) => entry.article);

  return ordered.slice(0, limit);
}
