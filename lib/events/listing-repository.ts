// Data access for the /events listing.
//
// Pages talk to an EventsRepository, never to fetch() directly, so the UI is
// unchanged when the backend arrives. Two adapters ship today:
//
//   MockEventsRepository  — local content, the default
//   HttpEventsRepository  — GET {base}/api/v1/pages/events
//
// Selected by NEXT_PUBLIC_DATA_SOURCE / NEXT_PUBLIC_API_BASE_URL.

import type {
  EventBenefit,
  EventStatus,
  EventSummary,
  EventsFinalCta,
  EventsFooterData,
  EventsHeroData,
  EventsPageData,
  LinkAction,
  MediaAsset,
} from './listing-types';
import { EVENTS_MOCK } from './mock';

export interface EventsRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type EventsRepositoryResult =
  | { ok: true; data: EventsPageData }
  | { ok: false; error: EventsRepositoryError };

export interface EventsRepository {
  getEventsPage(): Promise<EventsRepositoryResult>;
}

export class MockEventsRepository implements EventsRepository {
  async getEventsPage(): Promise<EventsRepositoryResult> {
    return { ok: true, data: EVENTS_MOCK };
  }
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
 * Deliberately does NOT fall back to mock content: a backend that answers with
 * an unusable body is an error the page should surface, not paper over with
 * local copy that would read as real.
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

export class HttpEventsRepository implements EventsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly revalidateSeconds = 300,
  ) {}

  async getEventsPage(): Promise<EventsRepositoryResult> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/api/v1/pages/events`;

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds },
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
      raw = await response.json();
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The events service returned an invalid response.' },
      };
    }

    const data = normalizeEventsPage(raw);
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
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

export interface EventsDataEnv {
  source: 'mock' | 'api';
  baseUrl: string;
}

export function readEventsEnv(): EventsDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
  };
}

/**
 * Returns the configured repository, or a config error when the site asks for
 * the API without giving it an address — better a visible misconfiguration
 * than a production page quietly serving mock content.
 */
export function getEventsRepository():
  | { ok: true; repository: EventsRepository }
  | { ok: false; error: EventsRepositoryError } {
  const env = readEventsEnv();

  if (env.source === 'api') {
    if (!env.baseUrl) {
      return {
        ok: false,
        error: {
          kind: 'config',
          message:
            'NEXT_PUBLIC_DATA_SOURCE=api requires NEXT_PUBLIC_API_BASE_URL to be configured.',
        },
      };
    }
    return { ok: true, repository: new HttpEventsRepository(env.baseUrl) };
  }

  return { ok: true, repository: new MockEventsRepository() };
}
