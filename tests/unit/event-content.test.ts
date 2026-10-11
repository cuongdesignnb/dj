import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  findContent: vi.fn(), findEvent: vi.fn(), transaction: vi.fn(),
  createContent: vi.fn(), updateContent: vi.fn(), upsertTranslation: vi.fn(), readContent: vi.fn(),
}));
vi.mock('@/server/db/client', () => ({ db: {
  pageContent: { findUnique: mocks.findContent },
  event: { findFirst: mocks.findEvent },
  $transaction: mocks.transaction,
} }));
import { getAdminPageContent, updateAdminPageContent } from '@/server/services/cms';
import { pageContentSchemas } from '@/lib/cms/page-content';
import { eventContentTemplate, parseEventContentKey, type EventContentKind } from '@/lib/cms/event-content-template';
import { eventScopeFromSearchParams, eventScopedHref, eventSlugFromParam } from '@/lib/events/event-scope';

const eventId = '018f5e61-28ef-47c1-a1bb-6bde1489b777';
const perth = { slug: 'hi-land-perth', translations: [{ locale: 'en', title: 'Hi-Land Perth' }] };
const kinds: EventContentKind[] = ['tickets', 'tables', 'booking'];
// Phrases scripts/cms-audit.mjs rejects outside seeds; a template must never reintroduce them.
const auditedCopy = ['YOUR NIGHT.', 'YOUR BOOTH.', 'BOOK YOUR EXPERIENCE', 'STAY CONNECTED', 'Ticket release details will be published here.', 'WHY OUR NIGHTS LAST'];

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
    pageContent: { create: mocks.createContent, update: mocks.updateContent, findUniqueOrThrow: mocks.readContent },
    pageContentTranslation: { upsert: mocks.upsertTranslation },
  }));
});

describe('event content templates', () => {
  it.each(kinds)('%s template passes the strict page-content schema', (kind) => {
    const result = pageContentSchemas[kind].safeParse(eventContentTemplate(kind, { title: 'Hi-Land Perth', slug: 'hi-land-perth' }));
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it.each(kinds)('%s template is neutral, event-specific and keeps visitors on the event', (kind) => {
    const json = JSON.stringify(eventContentTemplate(kind, { title: 'Hi-Land Perth', slug: 'hi-land-perth' }));
    for (const phrase of auditedCopy) expect(json).not.toContain(phrase);
    expect(json).not.toMatch(/destiny/i);
    expect(json).toContain('Hi-Land Perth');
    expect(json).toContain('/events/hi-land-perth');
  });

  it('VIP tables template links the booking request to the same event', () => {
    const template = eventContentTemplate('tables', { title: 'Hi-Land Perth', slug: 'hi-land-perth' }) as { finalCta: { primary: { href: string } } };
    expect(template.finalCta.primary.href).toBe('/book-now?event=hi-land-perth');
  });

  it('parses only event-scoped keys', () => {
    expect(parseEventContentKey(`tickets:${eventId}`)).toEqual({ kind: 'tickets', eventId });
    expect(parseEventContentKey(`booking:${eventId}`)).toEqual({ kind: 'booking', eventId });
    expect(parseEventContentKey('gallery-list')).toBeNull();
    expect(parseEventContentKey('tickets:')).toBeNull();
  });
});

describe('admin page content for events without a saved record', () => {
  it('returns an unsaved draft instead of a dead end', async () => {
    mocks.findContent.mockResolvedValue(null);
    mocks.findEvent.mockResolvedValue(perth);
    const result = await getAdminPageContent(`tickets:${eventId}`);
    expect(result).toMatchObject({ id: null, key: `tickets:${eventId}`, status: 'MISSING', persisted: false, updatedAt: null });
    expect(pageContentSchemas.tickets.safeParse(result.data).success).toBe(true);
    expect(mocks.findEvent).toHaveBeenCalledWith(expect.objectContaining({ where: { id: eventId, deletedAt: null } }));
  });

  it('keeps saved records untouched', async () => {
    mocks.findContent.mockResolvedValue({ id: 'row-1', key: `tickets:${eventId}`, status: 'PUBLISHED', updatedAt: new Date('2026-10-01T00:00:00Z'), translations: [{ locale: 'en', contentJson: { saved: true }, seoTitle: null, seoDescription: null, ogImageUrl: null }] });
    const result = await getAdminPageContent(`tickets:${eventId}`);
    expect(result).toMatchObject({ id: 'row-1', status: 'PUBLISHED', persisted: true, data: { saved: true } });
    expect(mocks.findEvent).not.toHaveBeenCalled();
  });

  it('rejects unknown or deleted events', async () => {
    mocks.findContent.mockResolvedValue(null);
    mocks.findEvent.mockResolvedValue(null);
    await expect(getAdminPageContent(`tables:${eventId}`)).rejects.toMatchObject({ status: 404, message: 'Event not found.' });
    await expect(getAdminPageContent('booking:not-an-id')).rejects.toMatchObject({ status: 404, message: 'Event not found.' });
  });

  it('still reports unseeded static pages as missing', async () => {
    mocks.findContent.mockResolvedValue(null);
    await expect(getAdminPageContent('gallery-list')).rejects.toMatchObject({ status: 404, message: 'Page content has not been seeded yet.' });
    expect(mocks.findEvent).not.toHaveBeenCalled();
  });

  it('creates the record on first save for an existing event', async () => {
    const data = eventContentTemplate('booking', { title: 'Hi-Land Perth', slug: 'hi-land-perth' });
    mocks.findContent.mockResolvedValue(null);
    mocks.findEvent.mockResolvedValue(perth);
    mocks.createContent.mockResolvedValue({ id: 'row-2' });
    mocks.readContent.mockResolvedValue({ id: 'row-2', key: `booking:${eventId}`, status: 'DRAFT', updatedAt: new Date(), translations: [{ locale: 'en', contentJson: data, seoTitle: null, seoDescription: null, ogImageUrl: null }] });
    const result = await updateAdminPageContent(`booking:${eventId}`, { data, status: 'DRAFT', locale: 'en' });
    expect(mocks.createContent).toHaveBeenCalledWith({ data: { key: `booking:${eventId}`, status: 'DRAFT' } });
    expect(result).toMatchObject({ id: 'row-2', status: 'DRAFT', persisted: true, created: true });
  });

  it('never creates content for an event that does not exist', async () => {
    mocks.findContent.mockResolvedValue(null);
    mocks.findEvent.mockResolvedValue(null);
    const data = eventContentTemplate('tickets', { title: 'Ghost', slug: 'ghost' });
    await expect(updateAdminPageContent(`tickets:${eventId}`, { data, status: 'PUBLISHED' })).rejects.toMatchObject({ status: 404 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe('public event scope', () => {
  it('reads ?event= safely', () => {
    expect(eventScopeFromSearchParams({})).toEqual({ kind: 'default' });
    expect(eventScopeFromSearchParams({ event: '' })).toEqual({ kind: 'default' });
    expect(eventScopeFromSearchParams({ event: 'Hi-Land-Perth' })).toEqual({ kind: 'event', slug: 'hi-land-perth' });
    expect(eventScopeFromSearchParams({ event: ['destiny', 'other'] })).toEqual({ kind: 'event', slug: 'destiny' });
    expect(eventScopeFromSearchParams({ event: '../admin' })).toEqual({ kind: 'invalid' });
    expect(eventSlugFromParam('a')).toBeNull();
  });

  it('builds links that keep the event', () => {
    expect(eventScopedHref('/tickets', 'hi-land-perth')).toBe('/tickets?event=hi-land-perth');
    expect(eventScopedHref('/book-now', null)).toBe('/book-now');
  });
});
