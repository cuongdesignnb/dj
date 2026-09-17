import type {
  ArticleContentBlock,
  ArticleStatus,
  MediaAsset,
  NewsArticle,
  NewsCategory,
} from './types';

// Normalizes news payloads from an API.
//
// Body arrives as structured blocks and is validated block by block. There is
// no HTML string path anywhere: a CMS cannot deliver markup that ends up in
// dangerouslySetInnerHTML, because nothing here ever calls it.

const CATEGORIES: NewsCategory[] = [
  'announcements',
  'event-updates',
  'artist-stories',
  'community',
  'press',
];
const STATUSES: ArticleStatus[] = ['draft', 'preview', 'published', 'archived'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function media(value: unknown): MediaAsset {
  if (!isRecord(value)) return { src: '', alt: '' };
  return {
    src: str(value.src),
    alt: str(value.alt),
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
    caption: nullableStr(value.caption),
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function block(value: unknown, index: number): ArticleContentBlock | null {
  if (!isRecord(value)) return null;
  const id = str(value.id, `block-${index}`);

  switch (value.type) {
    case 'paragraph': {
      const text = str(value.text);
      return text ? { id, type: 'paragraph', text } : null;
    }
    case 'heading': {
      const text = str(value.text);
      if (!text) return null;
      return { id, type: 'heading', level: value.level === 3 ? 3 : 2, text };
    }
    case 'image': {
      const asset = media(value.image);
      return asset.src ? { id, type: 'image', image: asset } : null;
    }
    case 'quote': {
      const text = str(value.text);
      return text
        ? { id, type: 'quote', text, attribution: nullableStr(value.attribution) }
        : null;
    }
    case 'list': {
      const items = strings(value.items);
      if (items.length === 0) return null;
      return { id, type: 'list', style: value.style === 'numbered' ? 'numbered' : 'bullet', items };
    }
    default:
      return null;
  }
}

/** ISO in, ISO out — formatting belongs to the presentation layer. */
function isoDate(value: unknown): string | null {
  const raw = nullableStr(value);
  if (!raw) return null;
  return Number.isNaN(Date.parse(raw)) ? null : raw;
}

export function normalizeArticle(value: unknown): NewsArticle | null {
  if (!isRecord(value)) return null;
  const slug = str(value.slug);
  const title = str(value.title);
  if (!slug || !title) return null;

  const status = STATUSES.includes(value.status as ArticleStatus)
    ? (value.status as ArticleStatus)
    : 'preview';

  return {
    id: str(value.id, slug),
    slug,
    title,
    excerpt: str(value.excerpt),
    category: CATEGORIES.includes(value.category as NewsCategory)
      ? (value.category as NewsCategory)
      : 'announcements',
    // Unknown status is treated as a preview: the cautious reading, never a
    // claim that something has been published.
    status,
    heroImage: media(value.heroImage),
    cardImage: isRecord(value.cardImage) ? media(value.cardImage) : null,
    // A date only counts on a published article.
    publishedAt: status === 'published' ? isoDate(value.publishedAt) : null,
    updatedAt: isoDate(value.updatedAt),
    readingTimeMinutes:
      typeof value.readingTimeMinutes === 'number' && value.readingTimeMinutes > 0
        ? Math.round(value.readingTimeMinutes)
        : null,
    tags: strings(value.tags).map((tag) => tag.replace(/^#/, '')),
    quickSummary: strings(value.quickSummary),
    body: Array.isArray(value.body)
      ? value.body.flatMap((item, index) => {
          const parsed = block(item, index);
          return parsed ? [parsed] : [];
        })
      : [],
    featured: value.featured === true,
    eventId: nullableStr(value.eventId),
    eventHref: nullableStr(value.eventHref),
    seoTitle: nullableStr(value.seoTitle),
    seoDescription: nullableStr(value.seoDescription),
    canonicalOverride: nullableStr(value.canonicalOverride),
    indexable: value.indexable !== false,
    followLinks: value.followLinks !== false,
  };
}

export function normalizeArticles(raw: unknown): NewsArticle[] {
  const source = isRecord(raw) && Array.isArray(raw.articles) ? raw.articles : raw;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item) => {
    const parsed = normalizeArticle(item);
    return parsed ? [parsed] : [];
  });
}
