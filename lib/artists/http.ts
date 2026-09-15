import type {
  Artist,
  ArtistEventReference,
  ArtistExternalLink,
  ArtistLinkType,
  ArtistMediaItem,
  MediaAsset,
} from './types';

// Normalizes artist payloads from an API.
//
// Anything the payload does not supply stays empty rather than being filled in
// locally: a missing bio is null, missing socials are an empty list, and the UI
// falls back or hides the section.

const LINK_TYPES: ArtistLinkType[] = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'spotify',
  'soundcloud',
  'website',
];

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

/** Only absolute https URLs become links; anything else is dropped. */
function externalLink(value: unknown): ArtistExternalLink | null {
  if (!isRecord(value)) return null;
  const type = str(value.type) as ArtistLinkType;
  if (!LINK_TYPES.includes(type)) return null;
  const raw = nullableStr(value.url);
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  return {
    type,
    url: parsed.toString(),
    label: typeof value.label === 'string' ? value.label : undefined,
  };
}

function mediaItem(value: unknown): ArtistMediaItem | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (!id) return null;
  return {
    id,
    type: value.type === 'video' ? 'video' : 'image',
    thumbnail: media(value.thumbnail),
    url: nullableStr(value.url),
    title: nullableStr(value.title),
  };
}

function eventReference(value: unknown): ArtistEventReference | null {
  if (!isRecord(value)) return null;
  const eventId = str(value.eventId) || str(value.eventSlug);
  const eventTitle = str(value.eventTitle);
  if (!eventId || !eventTitle) return null;
  return {
    eventId,
    eventSlug: str(value.eventSlug, eventId),
    eventTitle,
    href: str(value.href, '/event'),
    venue: nullableStr(value.venue),
    date: nullableStr(value.date),
    dateStatus: value.dateStatus === 'confirmed' ? 'confirmed' : 'tba',
    schedule: nullableStr(value.schedule),
    scheduleStatus: value.scheduleStatus === 'confirmed' ? 'confirmed' : 'tbc',
  };
}

export function normalizeArtist(value: unknown): Artist | null {
  if (!isRecord(value)) return null;
  const slug = str(value.slug);
  const name = str(value.name);
  if (!slug || !name) return null;

  const list = <T>(raw: unknown, parse: (item: unknown) => T | null): T[] =>
    Array.isArray(raw)
      ? raw.flatMap((item) => {
          const parsed = parse(item);
          return parsed ? [parsed] : [];
        })
      : [];

  return {
    id: str(value.id, slug),
    slug,
    name,
    country: str(value.country).toUpperCase(),
    year: nullableStr(value.year),
    portrait: media(value.portrait),
    heroImage: isRecord(value.heroImage) ? media(value.heroImage) : null,
    bio: nullableStr(value.bio),
    genres: Array.isArray(value.genres)
      ? value.genres.filter((g): g is string => typeof g === 'string')
      : [],
    setTime: nullableStr(value.setTime),
    setTimeStatus: value.setTimeStatus === 'confirmed' ? 'confirmed' : 'tba',
    externalLinks: list(value.externalLinks, externalLink),
    media: list(value.media, mediaItem),
    upcomingEvents: list(value.upcomingEvents, eventReference),
    pastEvents: list(value.pastEvents, eventReference),
    featured: value.featured === true,
  };
}

export function normalizeArtists(raw: unknown): Artist[] {
  const source = isRecord(raw) && Array.isArray(raw.artists) ? raw.artists : raw;
  if (!Array.isArray(source)) return [];
  return source.flatMap((item) => {
    const parsed = normalizeArtist(item);
    return parsed ? [parsed] : [];
  });
}
