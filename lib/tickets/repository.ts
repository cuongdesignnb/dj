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
    let contentResponse: Response;
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
      const eventPayload = await eventResponse.clone().json() as { data?: { id?: string } };
      const eventId = eventPayload.data?.id;
      if (!eventId) throw new Error('Event payload did not include an id.');
      contentResponse = await fetch(`${this.baseUrl.replace(/\/$/, '')}/api/v1/page-content/tickets:${encodeURIComponent(eventId)}`, {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.pageContent(`tickets:${eventId}`)] },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the ticketing service. Please try again shortly.',
        },
      };
    }

    if (!eventResponse.ok || !ticketsResponse.ok || !contentResponse.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The ticketing service returned ${!eventResponse.ok ? eventResponse.status : !ticketsResponse.ok ? ticketsResponse.status : contentResponse.status}. Please try again shortly.`,
        },
      };
    }

    let eventRaw: unknown;
    let ticketsRaw: unknown;
    let contentRaw: unknown;
    try {
      [eventRaw, ticketsRaw, contentRaw] = await Promise.all([eventResponse.json(), ticketsResponse.json(), contentResponse.json()]);
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The ticketing service returned an invalid response.' },
      };
    }

    const event = unwrapApiData<Record<string, any>>(eventRaw);
    const ticketPayload = unwrapApiData<{ settings: Record<string, any>; tiers: any[] }>(ticketsRaw);
    const contentPayload = unwrapApiData<{ data?: Record<string, any> }>(contentRaw);
    const content = contentPayload.data;
    if (!content) return { ok: false, error: { kind: 'invalid', message: 'The ticket page content is not configured.' } };
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
      tiers: ticketPayload.tiers.map((row) => ({
        ...row,
        description: row.description ?? '',
        price: { amountMinor: row.priceMinor, currency: row.currency },
        icon: 'Ticket',
        features: [],
        minQuantity: row.minQuantity ?? 1,
        maxQuantity: row.maxQuantity,
        defaultQuantity: row.defaultQuantity,
        highlighted: row.highlighted,
        availability: { status: row.availabilityStatus?.toLowerCase() === 'available' ? 'available' : row.availabilityStatus?.toLowerCase() === 'sold_out' ? 'sold-out' : 'unknown' },
      })),
      provider: ticketPayload.settings.externalProviderEnabled ? { providerName: ticketPayload.settings.providerName, checkoutUrl: ticketPayload.settings.providerUrl, eventExternalId: ticketPayload.settings.providerEventId, unavailableNote: content.provider?.unavailableNote } : { mode: 'unavailable', unavailableNote: content.provider?.unavailableNote },
      hero: content.hero,
      selector: content.selector,
      trustItems: content.trustItems,
      infoItems: content.infoItems,
      faq: content.faq,
      finalCta: content.finalCta,
      footer: content.footer ?? { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
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
