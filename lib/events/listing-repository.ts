// Data access for the /events listing.
//
// Pages talk to an EventsRepository, never to fetch() directly. Published
// event records are loaded through the API.

import type {
  ArchiveContentType,
  EventBenefit,
  EventStatus,
  EventSummary,
  EventsFinalCta,
  EventsFooterData,
  EventsHeroData,
  EventsPageData,
  LinkAction,
  MediaAsset,
  PastEventSummary,
  PastEventsHeroData,
  PastEventsPageData,
} from './listing-types';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { fetchPublicListingContent, listingAction, listingImage, listingTitleLines } from '@/lib/cms/public-page';

export interface EventsRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: EventsRepositoryError };

export type EventsRepositoryResult = RepositoryResult<EventsPageData>;
export type PastEventsRepositoryResult = RepositoryResult<PastEventsPageData>;

export interface EventsRepository {
  getEventsPage(): Promise<EventsRepositoryResult>;
  getPastEventsPage(): Promise<PastEventsRepositoryResult>;
}

// ---------------------------------------------------------------------------
// HTTP adapter
// ---------------------------------------------------------------------------

const EVENT_STATUSES: EventStatus[] = [
  'announced',
  'coming-soon',
  'tickets-available',
  'sold-out',
  'completed',
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

function action(value: unknown): LinkAction | null {
  if (!isRecord(value) || typeof value.label !== 'string') return null;
  return {
    label: value.label,
    href: nullableStr(value.href),
    external: value.external === true,
    unavailableNote:
      typeof value.unavailableNote === 'string' ? value.unavailableNote : undefined,
  };
}

/** Returns null when the payload is not a usable event, so callers can drop it. */
function eventSummary(value: unknown): EventSummary | null {
  if (!isRecord(value)) return null;
  const id = str(value.id) || str(value.slug);
  const title = str(value.title);
  if (!id || !title) return null;

  const status = EVENT_STATUSES.includes(value.status as EventStatus)
    ? (value.status as EventStatus)
    : 'coming-soon';

  return {
    id,
    slug: str(value.slug, id),
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    location: nullableStr(value.location),
    image: media(value.image),
    status,
    featured: value.featured === true,
    placeholder: value.placeholder === true,
    date: nullableStr(value.date),
    dateStatus: value.dateStatus === 'confirmed' ? 'confirmed' : 'tba',
    schedule: nullableStr(value.schedule),
    scheduleStatus: value.scheduleStatus === 'confirmed' ? 'confirmed' : 'tbc',
    genres: Array.isArray(value.genres) ? value.genres.filter((g): g is string => typeof g === 'string') : [],
    description: typeof value.description === 'string' ? value.description : undefined,
    detailHref: nullableStr(value.detailHref),
    ticketHref: nullableStr(value.ticketHref),
    notificationAction: action(value.notificationAction),
  };
}

function hero(value: unknown): EventsHeroData | null {
  if (!isRecord(value)) return null;
  const titleLines = Array.isArray(value.titleLines)
    ? value.titleLines.filter((l): l is string => typeof l === 'string')
    : [];
  const primaryCta = action(value.primaryCta);
  if (titleLines.length === 0 || !primaryCta) return null;

  const side = isRecord(value.visualAnnotations) && Array.isArray(value.visualAnnotations.side)
    ? value.visualAnnotations.side.filter((l): l is string => typeof l === 'string')
    : null;

  return {
    eyebrow: str(value.eyebrow),
    titleLines,
    description: str(value.description),
    primaryCta,
    secondaryCta: action(value.secondaryCta) ?? undefined,
    visual: media(value.visual),
    visualAnnotations: side ? { side } : undefined,
  };
}

function benefits(value: unknown): EventBenefit[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [
      {
        id: str(raw.id, title),
        title,
        description: str(raw.description),
        icon: str(raw.icon, 'Sparkles'),
      },
    ];
  });
}

function finalCta(value: unknown): EventsFinalCta | null {
  if (!isRecord(value)) return null;
  const title = str(value.title);
  const primary = action(value.primary);
  if (!title || !primary) return null;
  return {
    eyebrow: typeof value.eyebrow === 'string' ? value.eyebrow : undefined,
    title,
    description: typeof value.description === 'string' ? value.description : undefined,
    primary,
    secondary: action(value.secondary) ?? undefined,
    background: isRecord(value.background) ? media(value.background) : undefined,
  };
}

function footer(value: unknown): EventsFooterData {
  if (!isRecord(value)) {
    return { email: null, phone: null, socials: [], legalTermsHref: null, legalPrivacyHref: null };
  }
  const socials = Array.isArray(value.socials)
    ? value.socials.flatMap((raw) => {
        if (!isRecord(raw)) return [];
        const platform = str(raw.platform);
        if (!['instagram', 'facebook', 'youtube', 'tiktok'].includes(platform)) return [];
        return [
          {
            id: str(raw.id, platform),
            platform: platform as EventsFooterData['socials'][number]['platform'],
            url: nullableStr(raw.url),
          },
        ];
      })
    : [];
  return {
    email: nullableStr(value.email),
    phone: nullableStr(value.phone),
    socials,
    legalTermsHref: nullableStr(value.legalTermsHref),
    legalPrivacyHref: nullableStr(value.legalPrivacyHref),
  };
}

/**
 * Normalizes an API payload into EventsPageData.
 *
 * An unusable backend body is an error the page should surface, not paper over
 * with local copy that would read as real.
 */
export function normalizeEventsPage(raw: unknown): EventsPageData | null {
  if (!isRecord(raw)) return null;

  const heroData = hero(raw.hero);
  const ctaData = finalCta(raw.finalCta);
  if (!heroData || !ctaData) return null;

  const events = Array.isArray(raw.events)
    ? raw.events.flatMap((e) => {
        const parsed = eventSummary(e);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    hero: heroData,
    featuredEvent: eventSummary(raw.featuredEvent),
    events,
    benefits: benefits(raw.benefits),
    finalCta: ctaData,
    footer: footer(raw.footer),
  };
}

const ARCHIVE_CONTENT_TYPES: ArchiveContentType[] = ['recap', 'gallery', 'highlights'];

/** ISO date in, ISO date out — formatting stays in the presentation layer. */
function isoDate(value: unknown): string | null {
  const raw = nullableStr(value);
  if (!raw) return null;
  return Number.isNaN(Date.parse(raw)) ? null : raw;
}

function pastEventSummary(value: unknown): PastEventSummary | null {
  if (!isRecord(value)) return null;
  const id = str(value.id) || str(value.slug);
  const title = str(value.title);
  if (!id || !title) return null;

  const contentTypes = Array.isArray(value.contentTypes)
    ? value.contentTypes.filter((t): t is ArchiveContentType =>
        ARCHIVE_CONTENT_TYPES.includes(t as ArchiveContentType),
      )
    : [];

  return {
    id,
    slug: str(value.slug, id),
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    image: media(value.image),
    location: nullableStr(value.location),
    startDate: isoDate(value.startDate),
    genres: Array.isArray(value.genres)
      ? value.genres.filter((g): g is string => typeof g === 'string')
      : [],
    excerpt: typeof value.excerpt === 'string' ? value.excerpt : undefined,
    featured: value.featured === true,
    isPlaceholder: value.isPlaceholder === true,
    contentTypes,
    recapHref: nullableStr(value.recapHref),
    galleryHref: nullableStr(value.galleryHref),
    highlightsHref: nullableStr(value.highlightsHref),
  };
}

function pastHero(value: unknown): PastEventsHeroData | null {
  const base = hero(value);
  if (!base) return null;
  const note =
    isRecord(value) && isRecord(value.visualAnnotations) && Array.isArray(value.visualAnnotations.note)
      ? value.visualAnnotations.note.filter((l): l is string => typeof l === 'string')
      : undefined;
  return {
    ...base,
    visualAnnotations: base.visualAnnotations
      ? { side: base.visualAnnotations.side, note }
      : undefined,
  };
}

/**
 * Normalizes an API payload into PastEventsPageData. Like its sibling above it
 * returns null rather than blending in local content, so a bad response shows
 * as an error instead of as an archive that reads real.
 */
export function normalizePastEventsPage(raw: unknown): PastEventsPageData | null {
  if (!isRecord(raw)) return null;

  const heroData = pastHero(raw.hero);
  const ctaData = finalCta(raw.finalCta);
  if (!heroData || !ctaData) return null;

  const events = Array.isArray(raw.events)
    ? raw.events.flatMap((e) => {
        const parsed = pastEventSummary(e);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    hero: heroData,
    featuredRecap: pastEventSummary(raw.featuredRecap),
    events,
    benefits: benefits(raw.benefits),
    finalCta: ctaData,
    footer: footer(raw.footer),
  };
}

export class HttpEventsRepository implements EventsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private async getPage<T>(
    path: string,
    normalize: (raw: unknown) => T | null,
  ): Promise<RepositoryResult<T>> {
    const url = `${this.baseUrl.replace(/\/$/, '')}${path}`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.eventsPast] },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the events service. Please try again shortly.',
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The events service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    let raw: unknown;
    try {
      raw = unwrapApiData(await response.json());
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The events service returned an invalid response.' },
      };
    }

    const data = normalize(raw);
    if (!data) {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The events service returned data this page cannot display.',
        },
      };
    }

    return { ok: true, data };
  }

  async getEventsPage(): Promise<EventsRepositoryResult> {
    const result = await this.getPage('/api/v1/events', (raw) => {
      const rows = Array.isArray(raw) ? raw : [];
      const events = rows.flatMap((row) => {
        if (!isRecord(row)) return [];
        const parsed = eventSummary({
          id: row.id,
          slug: row.slug,
          title: row.title,
          subtitle: row.eyebrow,
          location: [isRecord(row.venue) ? row.venue.name : '', isRecord(row.venue) ? row.venue.city : ''].filter(Boolean).join(', '),
          image: row.poster ?? row.hero,
          status: row.lifecycleStatus === 'COMPLETED' ? 'completed' : row.featured ? 'announced' : 'coming-soon',
          featured: row.featured,
          date: row.startAt,
          dateStatus: String(row.dateStatus ?? '').toLowerCase(),
          schedule: row.startAt,
          scheduleStatus: String(row.scheduleStatus ?? '').toLowerCase(),
          genres: Array.isArray(row.genres) ? row.genres : [],
          description: row.shortDescription,
          detailHref: row.slug === 'destiny' ? '/event' : `/events/${row.slug}`,
          ticketHref: null,
          notificationAction: null,
        });
        return parsed ? [parsed] : [];
      });
      const featured = events.find((event) => event.featured) ?? events[0] ?? null;
      const visual = featured?.image ?? { src: '', alt: '' };
      return { hero: { eyebrow: 'UPCOMING EVENTS', titleLines: ['THE NIGHTS', 'WE ARE BUILDING'], description: 'Explore published Connection Rave events.', primaryCta: { label: featured ? 'Explore event' : 'Explore lineup', href: featured?.detailHref ?? '/lineup' }, secondaryCta: { label: 'Join the community', href: '/about' }, visual, visualAnnotations: { side: ['MUSIC', 'PEOPLE', 'ENERGY', 'CONNECTION'] } }, featuredEvent: featured, events, benefits: [], finalCta: { title: 'READY FOR THE NEXT NIGHT?', description: 'Follow the published event programme.', primary: { label: 'Explore events', href: '/events' }, secondary: { label: 'Contact us', href: '/contact' }, background: visual }, footer: { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' } };
    });
    if (!result.ok) return result;
    const content = await fetchPublicListingContent(this.baseUrl, 'events-list', this.revalidateSeconds);
    if (!content) return { ok: false, error: { kind: 'invalid', message: 'The events page content is unavailable.' } };
    const visual = listingImage(content.hero, result.data.hero.visual);
    return {
      ok: true,
      data: {
        content,
        ...result.data,
        hero: {
          ...result.data.hero,
          breadcrumb: content.hero?.breadcrumb,
          eyebrow: content.hero?.eyebrow ?? '',
          titleLines: listingTitleLines(content.hero, []),
          description: content.hero?.description ?? '',
          primaryCta: listingAction(content.hero?.primary, result.data.hero.primaryCta),
          secondaryCta: content.hero?.secondary ? listingAction(content.hero.secondary, result.data.hero.secondaryCta ?? result.data.hero.primaryCta) : undefined,
          visual,
          visualAnnotations: content.hero?.sideNotes || content.hero?.footNotes ? { side: content.hero.sideNotes ?? [], note: content.hero.footNotes } : undefined,
        },
        finalCta: {
          ...result.data.finalCta,
          eyebrow: content.finalCta?.eyebrow,
          title: content.finalCta?.title ?? '',
          description: content.finalCta?.description ?? content.finalCta?.subtitle,
          primary: listingAction(content.finalCta?.primary, result.data.finalCta.primary),
          secondary: content.finalCta?.secondary ? listingAction(content.finalCta.secondary, result.data.finalCta.secondary ?? result.data.finalCta.primary) : undefined,
          background: content.finalCta?.background ?? result.data.finalCta.background,
        },
      },
    };
  }

  async getPastEventsPage(): Promise<PastEventsRepositoryResult> {
    const result = await this.getPage('/api/v1/events/past', (raw) => {
      const rows = Array.isArray(raw) ? raw : [];
      const events = rows.flatMap((row) => {
        if (!isRecord(row)) return [];
        const parsed = pastEventSummary({ id: row.id, slug: row.slug, title: row.title, subtitle: row.eyebrow, image: row.poster ?? row.hero, location: [isRecord(row.venue) ? row.venue.name : '', isRecord(row.venue) ? row.venue.city : ''].filter(Boolean).join(', '), startDate: row.startAt, genres: row.genres, excerpt: row.shortDescription, featured: row.featured, isPlaceholder: false, contentTypes: [], recapHref: null, galleryHref: null, highlightsHref: null });
        return parsed ? [parsed] : [];
      });
      const featured = events.find((event) => event.featured) ?? events[0] ?? null;
      const visual = featured?.image ?? { src: '', alt: '' };
      return { hero: { eyebrow: 'PAST EVENTS', titleLines: ['THE NIGHTS', 'WE REMEMBER'], description: 'Published event archive records.', primaryCta: { label: 'View events', href: '/events' }, secondaryCta: { label: 'View gallery', href: '/gallery' }, visual, visualAnnotations: { side: ['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION'] } }, featuredRecap: featured, events, benefits: [], finalCta: { title: 'FIND THE NEXT NIGHT', primary: { label: 'Explore events', href: '/events' }, secondary: { label: 'View lineup', href: '/lineup' }, background: visual }, footer: { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' } };
    });
    if (!result.ok) return result;
    const content = await fetchPublicListingContent(this.baseUrl, 'past-events', this.revalidateSeconds);
    if (!content) return { ok: false, error: { kind: 'invalid', message: 'The past events page content is unavailable.' } };
    const visual = listingImage(content.hero, result.data.hero.visual);
    return {
      ok: true,
      data: {
        content,
        ...result.data,
        hero: {
          ...result.data.hero,
          breadcrumb: content.hero?.breadcrumb,
          eyebrow: content.hero?.eyebrow ?? '',
          titleLines: listingTitleLines(content.hero, []),
          description: content.hero?.description ?? '',
          primaryCta: listingAction(content.hero?.primary, result.data.hero.primaryCta),
          secondaryCta: content.hero?.secondary ? listingAction(content.hero.secondary, result.data.hero.secondaryCta ?? result.data.hero.primaryCta) : undefined,
          visual,
          visualAnnotations: content.hero?.sideNotes || content.hero?.footNotes ? { side: content.hero.sideNotes ?? [], note: content.hero.footNotes } : undefined,
        },
        finalCta: {
          ...result.data.finalCta,
          eyebrow: content.finalCta?.eyebrow,
          title: content.finalCta?.title ?? '',
          description: content.finalCta?.description ?? content.finalCta?.subtitle,
          primary: listingAction(content.finalCta?.primary, result.data.finalCta.primary),
          secondary: content.finalCta?.secondary ? listingAction(content.finalCta.secondary, result.data.finalCta.secondary ?? result.data.finalCta.primary) : undefined,
          background: content.finalCta?.background ?? result.data.finalCta.background,
        },
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface EventsDataEnv {
  source: 'api';
  baseUrl: string;
}

export function readEventsEnv(): EventsDataEnv {
  return {
    source: 'api',
    baseUrl: publicApiBaseUrl(),
  };
}

/**
 * Returns the configured repository, or a config error when the site asks for
 * the API without giving it an address — better a visible misconfiguration
 * than a production page quietly serving invented content.
 */
export function getEventsRepository():
  | { ok: true; repository: EventsRepository }
  | { ok: false; error: EventsRepositoryError } {
  return { ok: true, repository: new HttpEventsRepository(readEventsEnv().baseUrl) };
}
