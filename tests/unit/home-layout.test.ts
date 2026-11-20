import { describe, expect, it, vi } from 'vitest';
import { youtubeId } from '@/lib/home/youtube';

vi.mock('server-only', () => ({}));
const { toPageData } = await import('@/lib/events/repository.server');

describe('youtubeId', () => {
  it('reads the common YouTube link shapes', () => {
    expect(youtubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://youtu.be/dQw4w9WgXcQ?si=abc')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(youtubeId('https://m.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('rejects anything that is not a single video', () => {
    expect(youtubeId('https://www.youtube.com/@connection')).toBeNull();
    expect(youtubeId('https://vimeo.com/123456')).toBeNull();
    expect(youtubeId('javascript:alert(1)')).toBeNull();
    expect(youtubeId('')).toBeNull();
  });
});

const base = {
  id: '11111111-1111-4111-8111-111111111111', slug: 'night', title: 'Night', lineup: [],
  startAt: '2099-01-01T21:00:00.000Z', endAt: '2099-01-02T04:00:00.000Z',
  venue: { name: 'Club', city: 'Perth', address: null, mapUrl: null },
  ticketSettings: { enabled: true, saleStatus: 'ON_SALE', externalProviderEnabled: true, providerName: 'TicketsCandy', providerUrl: 'https://ticketscandy.com/e/x' },
  vip: { enabled: true, bookingEnabled: true, packages: [{ id: 'p1', name: 'Booth', bottles: [{ id: 'b1', name: 'Grey Goose', category: 'Vodka' }, { id: 'b2', name: 'grey goose' }] }], booths: [] },
};

describe('event page: tickets, VIP and bar list', () => {
  it('uses the written bar list when there is one', () => {
    const page = toPageData({ data: base }, { content: { barList: [{ category: 'Spirits', name: 'Hennessy VS', price: '$320', description: '' }, { category: 'Spirits', name: 'Hidden', price: '', description: '', enabled: false }] } })!;
    expect(page.event.barList?.map((item) => [item.category, item.name, item.price])).toEqual([['Spirits', 'Hennessy VS', '$320']]);
  });
  it('falls back to the VIP bottles, once each, without prices', () => {
    const page = toPageData({ data: base })!;
    expect(page.event.barList?.map((item) => [item.category, item.name, item.price])).toEqual([['Vodka', 'Grey Goose', '']]);
    expect(page.event.ticketSettings).toEqual({ enabled: true, saleStatus: 'ON_SALE', providerName: 'TicketsCandy', providerUrl: 'https://ticketscandy.com/e/x' });
    expect(page.event.vipEnabled).toBe(true);
    expect(page.event.isPast).toBe(false);
  });
  it('treats a finished or Past-marked event as past', () => {
    expect(toPageData({ data: { ...base, startAt: '2020-01-01T21:00:00.000Z', endAt: '2020-01-02T04:00:00.000Z' } })!.event.isPast).toBe(true);
    expect(toPageData({ data: { ...base, lifecycleStatus: 'PAST' } })!.event.isPast).toBe(true);
  });
});
