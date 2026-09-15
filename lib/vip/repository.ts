// Data access for /tables and /book-now.
//
//   MockVipRepository  — local canonical content, the default
//   HttpVipRepository  — GET  {base}/api/v1/events/{slug}/vip
//                        POST {base}/api/v1/booking-requests
//
// Selected by NEXT_PUBLIC_DATA_SOURCE / NEXT_PUBLIC_API_BASE_URL.

import type { BookingRequestInput, BookingRequestResult, VipPageData } from './types';
import { VIP_MOCK } from './mock';
import { normalizeVipPage } from './http';

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

export class MockVipRepository implements VipRepository {
  async getVipPage(): Promise<VipRepositoryResult> {
    return { ok: true, data: VIP_MOCK };
  }

  /**
   * There is no booking backend yet, so this reports the flow as unavailable
   * rather than returning a success the request never actually had. A form that
   * says "request received" when nothing received it is worse than one that
   * says it cannot send.
   */
  async submitBookingRequest(): Promise<BookingRequestResult> {
    return {
      status: 'unavailable',
      message:
        'Booking requests are not connected yet. Please contact the organiser to arrange a VIP table.',
    };
  }
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
    try {
      response = await fetch(this.url(`/api/v1/events/${this.eventSlug}/vip`), {
        headers: { accept: 'application/json' },
        next: { revalidate: this.revalidateSeconds },
      });
    } catch {
      return {
        ok: false,
        error: {
          kind: 'network',
          message: 'Could not reach the VIP service. Please try again shortly.',
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          kind: 'http',
          message: `The VIP service returned ${response.status}. Please try again shortly.`,
        },
      };
    }

    let raw: unknown;
    try {
      raw = await response.json();
    } catch {
      return {
        ok: false,
        error: { kind: 'invalid', message: 'The VIP service returned an invalid response.' },
      };
    }

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
  source: 'mock' | 'api';
  baseUrl: string;
  eventSlug: string;
}

export function readVipEnv(): VipDataEnv {
  const source = (process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'mock').trim().toLowerCase();
  return {
    source: source === 'api' || source === 'http' ? 'api' : 'mock',
    baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim(),
    eventSlug: (process.env.NEXT_PUBLIC_VIP_EVENT_SLUG ?? 'destiny').trim(),
  };
}

export function getVipRepository():
  | { ok: true; repository: VipRepository }
  | { ok: false; error: VipRepositoryError } {
  const env = readVipEnv();

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
    return { ok: true, repository: new HttpVipRepository(env.baseUrl, env.eventSlug) };
  }

  return { ok: true, repository: new MockVipRepository() };
}

/** True when no backend can accept a booking request, so the UI says so up front. */
export function isBookingSubmissionConnected(): boolean {
  const env = readVipEnv();
  return env.source === 'api' && env.baseUrl.length > 0;
}
