import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpTicketsRepository, getTicketsRepository } from '@/lib/tickets/repository';
import { HttpVipRepository, defaultVipEventSlug, readVipEnv } from '@/lib/vip/repository';
import { buildVipBookingUrl } from '@/lib/vip/selection';
import { eventContentTemplate } from '@/lib/cms/event-content-template';

const response = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'content-type': 'application/json' } });
const missing = () => new Response(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Event not found.' } }), { status: 404 });
const perth = { id: '018f5e61-28ef-47c1-a1bb-6bde1489b777', slug: 'hi-land-perth', title: 'Hi-Land Perth', dateStatus: 'TBA', scheduleStatus: 'TBC', venue: { name: 'Perth', city: 'Perth' } };
const ticketSettings = { settings: { ticketExternalProviderEnabled: false }, tiers: [] };
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('tickets repository scoped by event', () => {
  it('requests the chosen event and its own tickets content', async () => {
    const fetcher = vi.fn().mockImplementation(async (url: string) => url.includes('/page-content/')
      ? response({ data: eventContentTemplate('tickets', perth) })
      : response(url.endsWith('/tickets') ? ticketSettings : perth));
    vi.stubGlobal('fetch', fetcher);
    const result = await new HttpTicketsRepository('http://localhost:43291', 'hi-land-perth').getTicketsPage();
    expect(result.ok).toBe(true);
    const urls = fetcher.mock.calls.map(([url]) => String(url));
    expect(urls).toContain('http://localhost:43291/api/v1/events/hi-land-perth');
    expect(urls).toContain('http://localhost:43291/api/v1/events/hi-land-perth/tickets');
    expect(urls).toContain(`http://localhost:43291/api/v1/page-content/tickets:${perth.id}`);
  });

  it('reports an unknown event as not found instead of a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => missing()));
    const result = await new HttpTicketsRepository('http://localhost:43291', 'no-such-event').getTicketsPage();
    expect(result).toEqual({ ok: false, error: { kind: 'not-found', message: 'This event could not be found.' } });
  });

  it('reports unpublished ticket content as configuration', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('/page-content/') ? new Response('', { status: 404 }) : response(url.endsWith('/tickets') ? ticketSettings : perth)));
    const result = await new HttpTicketsRepository('http://localhost:43291', 'hi-land-perth').getTicketsPage();
    expect(result).toMatchObject({ ok: false, error: { kind: 'not-configured' } });
  });

  it('keeps destiny as the default event', async () => {
    const fetcher = vi.fn().mockImplementation(async () => missing());
    vi.stubGlobal('fetch', fetcher);
    const selection = getTicketsRepository();
    expect(selection.ok).toBe(true);
    if (selection.ok) await selection.repository.getTicketsPage();
    expect(String(fetcher.mock.calls[0][0])).toMatch(/\/api\/v1\/events\/destiny$/);
  });
});

describe('VIP repository scoped by event', () => {
  it('encodes the slug and reports an unknown event as not found', async () => {
    const fetcher = vi.fn().mockImplementation(async () => missing());
    vi.stubGlobal('fetch', fetcher);
    expect((await new HttpVipRepository('http://localhost:43291', 'hi-land-perth').getVipPage()).kind).toBe('event-not-found');
    expect(String(fetcher.mock.calls[0][0])).toMatch(/\/api\/v1\/events\/hi-land-perth$/);
  });

  it('uses the given slug and falls back to the configured default', () => {
    vi.stubEnv('NEXT_PUBLIC_VIP_EVENT_SLUG', ' ');
    expect(defaultVipEventSlug()).toBe('destiny');
    expect(readVipEnv('hi-land-perth').eventSlug).toBe('hi-land-perth');
    expect(readVipEnv(null).eventSlug).toBe('destiny');
    vi.stubEnv('NEXT_PUBLIC_VIP_EVENT_SLUG', 'other-default');
    expect(readVipEnv(null).eventSlug).toBe('other-default');
  });

  it('keeps a non-default event on the booking link', () => {
    expect(buildVipBookingUrl({ boothId: 'booth-1', bottleIds: ['b1'] }, '/book-now', 'hi-land-perth')).toBe('/book-now?event=hi-land-perth&experience=vip&booth=booth-1&bottles=b1');
    expect(buildVipBookingUrl({ boothId: null, bottleIds: [] })).toBe('/book-now?experience=vip');
  });
});
