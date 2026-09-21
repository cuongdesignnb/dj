// Data access for /tables and /book-now.
//
// Published content and booking requests are loaded through the API.

import type { BookingRequestInput, BookingRequestResult, VipPageData } from './types';
import { normalizeVipPage } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export interface VipRepositoryError {
  kind: 'network' | 'http' | 'invalid' | 'config';
  message: string;
}

export type VipRepositoryResult =
  | { ok: true; data: VipPageData }
  | { ok: false; error: VipRepositoryError };

export interface VipRepository {
  getVipPage(): Promise<VipRepositoryResult>;
  submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult>;
}

export class HttpVipRepository implements VipRepository {
  constructor(
    private readonly baseUrl: string,
    private readonly eventSlug: string,
    private readonly revalidateSeconds = 300,
  ) {}

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, '')}${path}`;
  }

  async getVipPage(): Promise<VipRepositoryResult> {
    let response: Response;
    let eventResponse: Response;
    try {
      [eventResponse, response] = await Promise.all([
        fetch(this.url(`/api/v1/events/${this.eventSlug}`), { headers: { accept: 'application/json' }, next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.events] } }),
        fetch(this.url(`/api/v1/events/${this.eventSlug}/vip`), { headers: { accept: 'application/json' }, next: { revalidate: this.revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.vip(this.eventSlug)] } }),
      ]);
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the VIP service. Please try again shortly.',
        },
      };
    }

    if (!response.ok || !eventResponse.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The VIP service returned ${!eventResponse.ok ? eventResponse.status : response.status}. Please try again shortly.`,
        },
      };
    }

    let eventRaw: unknown;
    let vipRaw: unknown;
    try {
      [eventRaw, vipRaw] = await Promise.all([eventResponse.json(), response.json()]);
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The VIP service returned an invalid response.' },
      };
    }

    const event = unwrapApiData<Record<string, any>>(eventRaw);
    const vip = unwrapApiData<{ packages: any[]; booths: any[] }>(vipRaw);
    const pkg = vip.packages[0];
    const bottles = pkg?.bottles ?? [];
    const raw = {
      event: { id: event.id, slug: event.slug, title: event.title, subtitle: event.eyebrow, venue: [event.venue?.name, event.venue?.city].filter(Boolean).join(', '), date: event.startAt, dateStatus: event.dateStatus?.toLowerCase(), schedule: event.startAt, scheduleStatus: event.scheduleStatus?.toLowerCase(), image: event.poster ?? event.hero },
      package: pkg ? { ...pkg, price: { amountMinor: pkg.priceMinor, currency: pkg.currency }, maxBottleSelections: bottles.length || 1, minBottleSelections: 0, description: '' } : null,
      booths: vip.booths,
      bottles: bottles.map((bottle: Record<string, any>, index: number) => ({ ...bottle, tint: ['#A6A6B2', '#F3B35A', '#E46A6A', '#8AC3FF', '#B78CFF', '#7BE0B2'][index % 6] })),
      mapDisclaimer: 'Booth positions are indicative. A request is not a reservation.',
      infoItems: [], faq: [], processSteps: [], bookingNotes: [], bookingFaq: [],
      tablesCta: { title: 'REQUEST A VIP EXPERIENCE', primary: { label: 'Send a request', href: '/book-now' } },
      bookingCta: { title: 'STAY CONNECTED', primary: { label: 'View events', href: '/events' } },
      footer: { email: null, phone: null, partners: [], socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
    };
    const data = normalizeVipPage(raw);
    if (!data) {
      return {
        ok: false,
        error: {
          kind: 'invalid',
          message: 'The VIP service returned data this page cannot display.',
        },
      };
    }

    return { ok: true, data };
  }

  async submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult> {
    // Only identifiers and the person's own details go up. Price and capacity
    // are resolved by the backend from packageId — never asserted by the client.
    let response: Response;
    try {
      response = await fetch(this.url('/api/v1/booking-requests'), {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(input),
      });
    } catch {
      return {
        status: 'error',
        message: 'Could not send your request. Please try again shortly.',
      };
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const record =
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const message = typeof record.message === 'string' ? record.message : undefined;

    if (response.status === 422 || response.status === 400) {
      const fieldErrors =
        typeof record.fieldErrors === 'object' && record.fieldErrors !== null
          ? (record.fieldErrors as Record<string, string>)
          : undefined;
      return {
        status: 'validation-error',
        message: message ?? 'Please check the highlighted fields and try again.',
        fieldErrors,
      };
    }

    if (response.status === 503) {
      return {
        status: 'unavailable',
        message:
          message ?? 'Booking requests are temporarily unavailable. Please contact the organiser.',
      };
    }

    if (!response.ok) {
      return {
        status: 'error',
        message: message ?? 'Could not send your request. Please try again shortly.',
      };
    }

    return {
      status: 'received',
      requestId: typeof record.requestId === 'string' ? record.requestId : undefined,
      message,
    };
  }
}

export interface VipDataEnv {
  source: 'api';
  baseUrl: string;
  eventSlug: string;
}

export function readVipEnv(): VipDataEnv {
  return {
    source: 'api',
    baseUrl: publicApiBaseUrl(),
    eventSlug: (process.env.NEXT_PUBLIC_VIP_EVENT_SLUG ?? 'destiny').trim(),
  };
}

export function getVipRepository():
  | { ok: true; repository: VipRepository }
  | { ok: false; error: VipRepositoryError } {
  const env = readVipEnv();
  return { ok: true, repository: new HttpVipRepository(env.baseUrl, env.eventSlug) };
}

/** True when no backend can accept a booking request, so the UI says so up front. */
export function isBookingSubmissionConnected(): boolean {
  return true;
}
