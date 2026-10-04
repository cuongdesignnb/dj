// Shared API access for /tables and /book-now. Booking details never enter URLs or logs.
import type { BookingRequestInput, BookingRequestResult, VipPageState } from './types';
import { normalizeVipState } from './http';
import { publicApiBaseUrl, unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export interface VipRepositoryError { kind: 'network' | 'http' | 'invalid' | 'config'; message: string }
export interface VipRepository {
  getVipPage(): Promise<VipPageState>;
  submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult>;
}
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export class HttpVipRepository implements VipRepository {
  constructor(private readonly baseUrl: string, private readonly eventSlug: string, private readonly revalidateSeconds = 300) {}
  private url(path: string) { return `${this.baseUrl.replace(/\/$/, '')}${path}`; }
  private fetch(path: string, tags: string[]) {
    return fetch(this.url(path), { headers: { accept: 'application/json' }, next: { revalidate: this.revalidateSeconds, tags } });
  }
  async getVipPage(): Promise<VipPageState> {
    const invalid = (): VipPageState => ({ kind: 'invalid-response', message: 'We received data this page could not read.' });
    const unavailable = (): VipPageState => ({ kind: 'service-unavailable', message: "We couldn't reach the VIP service. Please try again shortly." });
    let eventResponse: Response;
    let vipResponse: Response;
    try {
      [eventResponse, vipResponse] = await Promise.all([
        this.fetch(`/api/v1/events/${this.eventSlug}`, [PUBLIC_CACHE_TAGS.events]),
        this.fetch(`/api/v1/events/${this.eventSlug}/vip`, [PUBLIC_CACHE_TAGS.events, PUBLIC_CACHE_TAGS.vip(this.eventSlug)]),
      ]);
    } catch { return unavailable(); }
    if (!eventResponse.ok || !vipResponse.ok) return unavailable();
    let event: unknown;
    let vip: unknown;
    try { [event, vip] = await Promise.all([eventResponse.json(), vipResponse.json()]); } catch { return invalid(); }
    event = unwrapApiData(event);
    vip = unwrapApiData(vip);
    const eventId = record(event)?.id;
    if (typeof eventId !== 'string' || !eventId) return invalid();
    let responses: Response[];
    const keys = [`tables:${eventId}`, `booking:${eventId}`];
    try { responses = await Promise.all(keys.map((key) => this.fetch(`/api/v1/page-content/${encodeURIComponent(key)}`, [PUBLIC_CACHE_TAGS.pageContent(key)]))); }
    catch { return unavailable(); }
    // Missing published CMS records are configuration, not malformed VIP data or network failure.
    if (responses.some((response) => !response.ok && response.status !== 404)) return unavailable();
    let content: unknown[];
    try { content = await Promise.all(responses.map(async (response) => response.status === 404 ? null : record(unwrapApiData(await response.json()))?.data)); }
    catch { return invalid(); }
    return normalizeVipState(event, vip, content[0], content[1]);
  }
  async submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult> {
    let response: Response;
    try {
      response = await fetch(this.url('/api/v1/booking-requests'), {
        method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(input),
      });
    } catch { return { status: 'error', message: 'Could not send your request. Please try again shortly.' }; }
    const envelope = record(await response.json().catch(() => null));
    const error = record(envelope?.error);
    const data = record(envelope?.data);
    const message = typeof error?.message === 'string' ? error.message : undefined;
    if (response.status === 400 || response.status === 422) return {
      status: 'validation-error', message: message ?? 'Please check the highlighted fields and try again.',
      fieldErrors: record(error?.fieldErrors) as Record<string, string> | undefined,
    };
    if (response.status === 503 || response.status === 409) return { status: 'unavailable', message: message ?? 'Booking requests are temporarily unavailable.' };
    if (!response.ok || typeof data?.id !== 'string' || data.status !== 'RECEIVED') return { status: 'error', message: message ?? 'Could not send your request. Please try again shortly.' };
    return { status: 'received', requestId: data.id, message: 'Request received. This is not a confirmed reservation; the team will review availability.' };
  }
}
export function readVipEnv() {
  return { source: 'api' as const, baseUrl: publicApiBaseUrl(), eventSlug: (process.env.NEXT_PUBLIC_VIP_EVENT_SLUG ?? 'destiny').trim() };
}
export function getVipRepository(): { ok: true; repository: VipRepository } | { ok: false; error: VipRepositoryError } {
  const env = readVipEnv();
  return { ok: true, repository: new HttpVipRepository(env.baseUrl, env.eventSlug) };
}
export function isBookingSubmissionConnected() { return true; }
