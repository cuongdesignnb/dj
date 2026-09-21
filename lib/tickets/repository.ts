// Data access for /tickets.
//
// Published ticket tiers are loaded through the API.

import type { TicketsPageData } from './types';
import { normalizeTicketsPage } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export interface TicketsRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type TicketsRepositoryResult =
  | { ok: true; data: TicketsPageData }
  | { ok: false; error: TicketsRepositoryError };

export interface TicketsRepository {
  getTicketsPage(): Promise<TicketsRepositoryResult>;
}

export class HttpTicketsRepository implements TicketsRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly eventSlug = 'destiny',
    private readonly revalidateSeconds = 120,
  ) {}

  async getTicketsPage(): Promise<TicketsRepositoryResult> {
    const eventUrl = `${this.baseUrl.replace(/\/$/, '')}/api/v1/events/${encodeURIComponent(this.eventSlug)}`;
    const ticketsUrl = `${eventUrl}/tickets`;

    let eventResponse: Response;
    let ticketsResponse: Response;
    try {
      [eventResponse, ticketsResponse] = await Promise.all([
        fetch(eventUrl, {
          headers: { accept: 'application/json' },
          next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.events] },
        }),
        fetch(ticketsUrl, {
          headers: { accept: 'application/json' },
          next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.tickets(this.eventSlug)] },
        }),
      ]);
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the ticketing service. Please try again shortly.',
        },
      };
    }

    if (!eventResponse.ok || !ticketsResponse.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The ticketing service returned ${!eventResponse.ok ? eventResponse.status : ticketsResponse.status}. Please try again shortly.`,
        },
      };
    }

    let eventRaw: unknown;
    let ticketsRaw: unknown;
    try {
      [eventRaw, ticketsRaw] = await Promise.all([eventResponse.json(), ticketsResponse.json()]);
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The ticketing service returned an invalid response.' },
      };
    }

    const event = unwrapApiData<Record<string, any>>(eventRaw);
    const ticketRows = unwrapApiData<any[]>(ticketsRaw);
    const raw = {
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        subtitle: event.eyebrow,
        venue: [event.venue?.name, event.venue?.city].filter(Boolean).join(', '),
        date: event.startAt,
        dateStatus: event.dateStatus?.toLowerCase(),
        schedule: event.startAt,
        scheduleStatus: event.scheduleStatus?.toLowerCase(),
        image: event.poster ?? event.hero,
      },
      tiers: ticketRows.map((row) => ({
        ...row,
        description: row.description ?? '',
        price: { amountMinor: row.priceMinor, currency: row.currency },
        icon: 'Ticket',
        features: [],
        minQuantity: 0,
        availability: { status: row.availabilityStatus?.toLowerCase() === 'available' ? 'available' : 'unknown' },
      })),
      provider: { mode: 'unavailable', unavailableNote: 'Ticket provider link will be published when confirmed.' },
      trustItems: [], infoItems: [], faq: [],
      finalCta: { title: 'STAY CONNECTED', subtitle: 'Ticket release details will be published here.', primary: { label: 'View event', href: '/event' }, secondary: { label: 'Contact us', href: '/contact' }, background: event.hero },
      footer: { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
    };
    const data = normalizeTicketsPage(raw);
    if (!data) {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The ticketing service returned data this page cannot display.',
        },
      };
    }

    return { ok: true, data };
  }
}

export interface TicketsDataEnv {
  source: 'api';
  baseUrl: string;
}

export function readTicketsEnv(): TicketsDataEnv {
  return {
    source: 'api',
    baseUrl: publicApiBaseUrl(),
  };
}

/**
 * Returns the configured repository, or a config error when the site asks for
 * the API without giving it an address — a visible misconfiguration beats a
 * production page quietly serving local prices.
 */
export function getTicketsRepository():
  | { ok: true; repository: TicketsRepository }
  | { ok: false; error: TicketsRepositoryError } {
  const env = readTicketsEnv();
  return { ok: true, repository: new HttpTicketsRepository(env.baseUrl, 'destiny') };
}
