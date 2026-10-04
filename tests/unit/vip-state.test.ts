import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeVipState } from '@/lib/vip/http';
import { HttpVipRepository } from '@/lib/vip/repository';
import { validateBookingRequest } from '@/lib/vip/validation';
import { bookingSchema } from '@/server/validators/api';

const event = { id: 'qa-event', slug: 'destiny', title: 'DESTINY', dateStatus: 'TBA', scheduleStatus: 'TBC' };
const content = { hero: { titleLine1: 'VIP', titleLine2: 'TABLES' }, finalCta: { title: 'Send a request', primary: { label: 'Request', href: '/book-now' } } };
const pkg = { id: 'qa-package', name: 'QA Package', priceMinor: 320000, currency: 'AUD', paymentMode: 'request-only', capacity: 15, includedBottleCount: 3, minBottleSelections: 0, maxBottleSelections: 3, bottles: [{ id: 'qa-bottle', name: 'QA Bottle' }] };
const booth = { id: 'qa-booth', label: 'QA', availability: 'available', requestable: true };
const vip = () => ({ settings: { id: event.id, vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: 'REQUEST_ONLY', vipSquareEnabled: false }, packages: [structuredClone(pkg)], booths: [structuredClone(booth)] });
const input = { eventId: event.id, vipPackageId: pkg.id, fullName: 'QA Guest', email: 'qa@example.test', phone: '+61000000000', groupSize: 2, preferredBoothId: null, bottleIds: [] };
const repo = () => new HttpVipRepository('http://localhost:43291', 'destiny');
const response = (data: unknown, status = 200) => new Response(JSON.stringify({ data }), { status, headers: { 'content-type': 'application/json' } });
afterEach(() => vi.unstubAllGlobals());

describe('VIP business-state classifier', () => {
  it('accepts the real disabled production shape with empty arrays', () => {
    const raw = vip(); raw.settings.vipEnabled = false; raw.packages = []; raw.booths = [];
    expect(normalizeVipState(event, raw, content, content).kind).toBe('vip-disabled');
  });
  it('distinguishes disabled booking', () => {
    const raw = vip(); raw.settings.vipBookingEnabled = false;
    expect(normalizeVipState(event, raw, content, content)).toMatchObject({ kind: 'booking-disabled', canRequest: false });
  });
  it('distinguishes a disabled/missing active package', () => {
    const raw = vip(); raw.packages = [];
    expect(normalizeVipState(event, raw, content, content).kind).toBe('no-active-package');
  });
  it('uses the explicitly selected default instead of the first active package', () => {
    const raw = vip(); raw.packages.push({ ...pkg, id: 'selected-package', name: 'Selected Package' });
    expect(normalizeVipState(event, { ...raw, settings: { ...raw.settings, vipDefaultPackageId: 'selected-package' } }, content, content)).toMatchObject({ kind: 'ready', data: { package: { id: 'selected-package' } } });
  });
  it('a disabled/missing selected default does not silently fall back to another package', () => {
    const raw = vip();
    expect(normalizeVipState(event, { ...raw, settings: { ...raw.settings, vipDefaultPackageId: 'disabled-package' } }, content, content).kind).toBe('no-active-package');
  });
  it('missing published CMS content is configuration, not malformed API data', () => {
    expect(normalizeVipState(event, vip(), null, content)).toMatchObject({ kind: 'not-configured', reason: 'content' });
  });
  it('permits a generic request without booths only in request-only mode', () => {
    const raw = vip(); raw.booths = [];
    expect(normalizeVipState(event, raw, content, content)).toMatchObject({ kind: 'no-booths', canRequest: true, data: { allowBoothlessRequest: true } });
    raw.settings.vipAvailabilityMode = 'LIVE';
    expect(normalizeVipState(event, raw, content, content)).toMatchObject({ kind: 'no-booths', canRequest: false });
  });
  it('unavailable booths cannot be selected or requested', () => {
    const raw = vip(); raw.booths[0].availability = 'unavailable';
    expect(normalizeVipState(event, raw, content, content)).toMatchObject({ kind: 'no-availability', canRequest: false, data: { booths: [{ requestable: false }] } });
  });
  it('ready retains the real package, bottles and available booths', () => {
    expect(normalizeVipState(event, vip(), content, content)).toMatchObject({ kind: 'ready', canRequest: true, data: { package: { id: pkg.id, paymentMode: 'request-only' }, bottles: [{ id: 'qa-bottle' }], booths: [{ id: booth.id, requestable: true }] } });
  });
  it.each([-1, 12.5, NaN])('rejects invalid minor-unit money %s', (price) => {
    const raw = vip(); raw.packages[0].priceMinor = price;
    expect(normalizeVipState(event, raw, content, content).kind).toBe('invalid-response');
  });
  it.each([{ ...event, title: '' }, { ...event, id: '' }, null])('rejects an unreadable event', (rawEvent) => {
    expect(normalizeVipState(rawEvent, vip(), content, content).kind).toBe('invalid-response');
  });
  it('malformed arrays are not valid empty arrays', () => {
    expect(normalizeVipState(event, { ...vip(), packages: {} }, content, content).kind).toBe('invalid-response');
  });
});

describe('HTTP repository and real API envelopes', () => {
  it('network failures have their own state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await repo().getVipPage()).kind).toBe('service-unavailable');
  });
  it('HTTP service errors have their own state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    expect((await repo().getVipPage()).kind).toBe('service-unavailable');
  });
  it('unreadable JSON is an invalid response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response('{')));
    expect((await repo().getVipPage()).kind).toBe('invalid-response');
  });
  it('reads the production disabled contract without demanding a package', async () => {
    const raw = vip(); raw.settings.vipEnabled = false; raw.packages = []; raw.booths = [];
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => response(url.includes('/page-content/') ? { data: content } : url.endsWith('/vip') ? raw : event)));
    expect((await repo().getVipPage()).kind).toBe('vip-disabled');
  });
  it('CMS 404 is not a transport failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => url.includes('/page-content/') ? new Response('', { status: 404 }) : response(url.endsWith('/vip') ? vip() : event)));
    expect((await repo().getVipPage()).kind).toBe('not-configured');
  });
  it('sends vipPackageId and only interprets RECEIVED as a received request', async () => {
    expect(bookingSchema.safeParse(input).success).toBe(true);
    const fetcher = vi.fn().mockResolvedValue(response({ id: 'request-id', status: 'RECEIVED' }, 202));
    vi.stubGlobal('fetch', fetcher);
    expect(await repo().submitBookingRequest(input)).toMatchObject({ status: 'received', requestId: 'request-id', message: expect.stringContaining('not a confirmed reservation') });
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(input);
  });
  it('never fabricates success from a malformed successful HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ id: 'request-id', status: 'CONFIRMED' })));
    expect((await repo().submitBookingRequest(input)).status).toBe('error');
  });
  it('preserves structured API field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'Invalid request.', fieldErrors: { groupSize: 'Capacity exceeded.' } } }), { status: 422 })));
    expect(await repo().submitBookingRequest(input)).toMatchObject({ status: 'validation-error', fieldErrors: { groupSize: 'Capacity exceeded.' } });
  });
  it('client capacity and nullable booth validation match request-only rules', () => {
    const state = normalizeVipState(event, vip(), content, content);
    if (!('data' in state)) throw new Error('Expected a package fixture');
    expect(validateBookingRequest(input, state.data.package, { allowBoothlessRequest: true }).ok).toBe(true);
    expect(validateBookingRequest(input, state.data.package).errors.preferredBoothId).toBeTruthy();
    expect(validateBookingRequest({ ...input, groupSize: 16 }, state.data.package, { allowBoothlessRequest: true }).errors.groupSize).toBeTruthy();
  });
});
