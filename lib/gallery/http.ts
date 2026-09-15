import type {
  GalleryCategory,
  GalleryCollection,
  GalleryCollectionStatus,
  GalleryMediaItem,
  GalleryVideoSource,
  MediaAsset,
} from './types';

// Normalizes gallery payloads from an API. Anything unrecognised is dropped
// rather than guessed, and a video source is only accepted from a known
// provider with an https URL — a CMS string never becomes raw embed HTML.

const CATEGORIES: GalleryCategory[] = [
  'crowd',
  'artists',
  'venue',
  'production',
  'video',
  'other',
];
const STATUSES: GalleryCollectionStatus[] = ['preview', 'published', 'archived'];

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
  };
}

function videoSource(value: unknown): GalleryVideoSource | null {
  if (!isRecord(value)) return null;
  const provider = str(value.provider);
  if (!['youtube', 'vimeo', 'mp4'].includes(provider)) return null;
  const url = nullableStr(value.url);
  if (!url || !/^https:\/\//.test(url)) return null;
  return { provider: provider as GalleryVideoSource['provider'], url };
}

export function normalizeMediaItem(value: unknown, index = 0): GalleryMediaItem | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (!id) return null;

  const type: GalleryMediaItem['type'] = value.type === 'video' ? 'video' : 'photo';
  const category = CATEGORIES.includes(value.category as GalleryCategory)
    ? (value.category as GalleryCategory)
    : 'other';

  return {
    id,
    type,
    category,
    thumbnail: media(value.thumbnail),
    image: isRecord(value.image) ? media(value.image) : null,
    video: videoSource(value.video),
    title: nullableStr(value.title),
    caption: nullableStr(value.caption),
    featured: value.featured === true,
    sortOrder: typeof value.sortOrder === 'number' ? value.sortOrder : index,
  };
}

export function normalizeCollection(value: unknown): GalleryCollection | null {
  if (!isRecord(value)) return null;
  const slug = str(value.slug);
  const title = str(value.title);
  if (!slug || !title) return null;

  const mediaItems = Array.isArray(value.media)
    ? value.media.flatMap((item, index) => {
        const parsed = normalizeMediaItem(item, index);
        return parsed ? [parsed] : [];
      })
    : [];

  const categories = Array.isArray(value.categories)
    ? value.categories.filter((c): c is GalleryCategory => CATEGORIES.includes(c as GalleryCategory))
    : [];

  return {
    id: str(value.id, slug),
    slug,
    title,
    subtitle: nullableStr(value.subtitle),
    description: nullableStr(value.description),
    // Unknown status is treated as a preview: the cautious reading, never a
    // claim that the collection documents a completed event.
    status: STATUSES.includes(value.status as GalleryCollectionStatus)
      ? (value.status as GalleryCollectionStatus)
      : 'preview',
    cover: media(value.cover),
    hero: isRecord(value.hero) ? media(value.hero) : null,
    venue: nullableStr(value.venue),
    categories,
    media: mediaItems,
    eventId: nullableStr(value.eventId),
    eventSlug: nullableStr(value.eventSlug),
    eventHref: nullableStr(value.eventHref),
    featured: value.featured === true,
  };
}

export function normalizeCollections(raw: unknown): GalleryCollection[] {
  const source = isRecord(raw) && Array.isArray(raw.collections) ? raw.collections : raw;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item) => {
    const parsed = normalizeCollection(item);
    return parsed ? [parsed] : [];
  });
}
