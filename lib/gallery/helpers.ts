import type {
  CollectionMediaFilter,
  GalleryCategory,
  GalleryCategoryFilter,
  GalleryCollection,
  GalleryMediaItem,
  GalleryVideoSource,
} from './types';

export const CATEGORY_LABELS: Record<GalleryCategory, string> = {
  crowd: 'Crowd',
  artists: 'Artists',
  venue: 'Venue',
  production: 'Production',
  video: 'Video',
  other: 'Other',
};

export function categoryLabel(category: GalleryCategory): string {
  return CATEGORY_LABELS[category];
}

export function matchesCategory(
  item: GalleryMediaItem,
  filter: GalleryCategoryFilter,
): boolean {
  return filter === 'all' || item.category === filter;
}

export function matchesMediaType(
  item: GalleryMediaItem,
  filter: CollectionMediaFilter,
): boolean {
  return filter === 'all' || item.type === filter;
}

/** Only offers filters that actually have media behind them. */
export function availableCategories(items: GalleryMediaItem[]): GalleryCategoryFilter[] {
  const present: GalleryCategory[] = [];
  for (const item of items) {
    if (!present.includes(item.category)) present.push(item.category);
  }
  const order: GalleryCategory[] = ['crowd', 'artists', 'venue', 'production', 'video', 'other'];
  return ['all', ...order.filter((category) => present.includes(category))];
}

export function sortMedia(items: GalleryMediaItem[]): GalleryMediaItem[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function countPhotos(collection: GalleryCollection): number {
  return collection.media.filter((item) => item.type === 'photo').length;
}

export function countVideos(collection: GalleryCollection): number {
  return collection.media.filter((item) => item.type === 'video').length;
}

/** Only a clip with a real source is playable — a typed slot alone is not. */
export function isPlayable(item: GalleryMediaItem): boolean {
  return item.type === 'video' && !!item.video?.url;
}

export function featuredMedia(collection: GalleryCollection): GalleryMediaItem | null {
  const sorted = sortMedia(collection.media);
  return sorted.find((item) => item.featured) ?? sorted[0] ?? null;
}

export function videoHighlight(collection: GalleryCollection): GalleryMediaItem | null {
  return sortMedia(collection.media).find((item) => item.type === 'video') ?? null;
}

export function statusLabel(collection: GalleryCollection): string {
  switch (collection.status) {
    case 'published':
      return 'Published collection';
    case 'archived':
      return 'Archived collection';
    case 'preview':
    default:
      return 'Gallery preview';
  }
}

/**
 * Section heading for the media grid.
 *
 * A preview collection must not be titled as if it documented a night that
 * happened — that wording is reserved for a published collection.
 */
export function mediaSectionTitle(collection: GalleryCollection): string {
  return collection.status === 'published'
    ? 'Moments From The Night'
    : 'Moments From The Experience';
}

/**
 * Builds an embed URL from a validated provider and id.
 *
 * Never renders provider HTML from the data source — only an https URL this
 * function constructs itself, so a CMS string cannot become an iframe.
 */
export function buildEmbedUrl(video: GalleryVideoSource): string | null {
  if (video.provider === 'mp4') {
    return /^https:\/\//.test(video.url) ? video.url : null;
  }

  let parsed: URL;
  try {
    parsed = new URL(video.url);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;

  if (video.provider === 'youtube') {
    const host = parsed.hostname.replace(/^www\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = parsed.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'm.youtube.com') id = parsed.searchParams.get('v');
    else if (host === 'www.youtube-nocookie.com' || host === 'youtube-nocookie.com') {
      id = parsed.pathname.split('/').pop() ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }

  if (video.provider === 'vimeo') {
    if (parsed.hostname.replace(/^www\./, '') !== 'vimeo.com') return null;
    const id = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    if (!/^\d{5,12}$/.test(id)) return null;
    return `https://player.vimeo.com/video/${id}`;
  }

  return null;
}
