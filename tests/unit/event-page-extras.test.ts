import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { toPageData } = await import('@/lib/events/repository.server');

const event = {
  data: {
    id: '11111111-1111-4111-8111-111111111111', slug: 'hi-land-perth', title: 'HI-LAND PERTH', description: 'About the night.',
    startAt: '2026-11-07T21:00:00.000Z', endAt: '2026-11-08T04:00:00.000Z', lineup: [],
    venue: { name: 'Rapture Nightclub', city: 'Perth', address: '78 James Street, Northbridge', mapUrl: null },
  },
};

describe('event page extras', () => {
  it('without extras the page has no placeholder cards and no organiser', () => {
    const page = toPageData(event)!;
    expect(page.event.highlights).toEqual([]);
    expect(page.event.organiser).toBeNull();
    expect(page.event.venue.description).toBe('');
    expect(page.event.reviews).toEqual({ summary: { count: 0, average: null }, items: [] });
  });

  it('maps Admin content, reviews and site contact into the page', () => {
    const page = toPageData(event, {
      content: {
        highlights: [{ icon: 'Music', title: 'Techno · Hardstyle', description: 'Fast club genres' }, { icon: 'Zap', title: 'Off', description: '', enabled: false }],
        expectations: [{ icon: 'whatever', title: 'Continuous DJ sets', description: '' }],
        experience: { image: null, captions: ['Bass', 'Lights'] },
        goodToKnow: [{ icon: 'IdCard', title: '18+ with photo ID', description: '' }],
        venue: { image: null, description: 'Northbridge club.', directions: 'Train to Perth station.' },
        organiser: { name: 'BIHI Entertainment', description: '', website: 'https://bihientertainment.com', instagram: 'javascript:alert(1)', facebook: '' },
        finalCta: { title: 'See you on the floor', subtitle: '' },
      },
      reviews: { summary: { count: 1, average: 5 }, reviews: [{ id: 'r1', authorName: 'Linh', rating: 5, comment: 'Great night out!', createdAt: '2026-06-01T00:00:00.000Z', event: { slug: 'destiny', title: 'DESTINY' } }] },
      settings: { 'contact.email': 'hello@example.test', 'social.instagram': 'https://instagram.com/connection' },
    })!;
    expect(page.event.highlights.map((card) => card.title)).toEqual(['Techno · Hardstyle']);
    expect(page.event.expectations[0].icon).toBe('whatever');
    expect(page.event.goodToKnow?.[0].title).toBe('18+ with photo ID');
    expect(page.event.experienceCaptions).toEqual(['Bass', 'Lights']);
    expect(page.event.venue.directions).toBe('Train to Perth station.');
    // Only http(s) links survive.
    expect(page.event.organiser).toEqual({ name: 'BIHI Entertainment', description: '', website: 'https://bihientertainment.com', instagram: null, facebook: null });
    expect(page.event.finalCta).toEqual({ title: 'See you on the floor', subtitle: '' });
    expect(page.event.reviews?.items[0]).toMatchObject({ authorName: 'Linh', rating: 5, event: { title: 'DESTINY' } });
    expect(page.site.contact).toEqual({ email: 'hello@example.test', phone: null, socials: [{ id: 'instagram', platform: 'instagram', url: 'https://instagram.com/connection' }] });
  });
});
