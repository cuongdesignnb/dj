import { describe, expect, it } from 'vitest';
import { ticketSetupStatus, vipSetupStatus, type VipFacts } from '@/lib/admin/events/setup-status';

const id = '11111111-1111-4111-8111-111111111111';
const blocking = (status: ReturnType<typeof ticketSetupStatus>) => status.checks.filter((c) => c.level === 'blocking').map((c) => c.id);

describe('ticketSetupStatus', () => {
  it('is live with a published event, published content and an enabled tier', () => {
    const status = ticketSetupStatus({ eventId: id, eventPublished: true, publicHref: '/tickets?event=x', contentStatus: 'PUBLISHED', activeTiers: 2 });
    expect(status.live).toBe(true);
    expect(status.headline).toBe('Showing ticket options on the site');
    expect(status.checks.find((c) => c.id === 'tiers')?.title).toBe('2 ticket tiers enabled');
  });

  it('explains the "being prepared" message and links to the tier editor', () => {
    const status = ticketSetupStatus({ eventId: id, eventPublished: true, publicHref: '/tickets', contentStatus: 'PUBLISHED', activeTiers: 0 });
    expect(status.live).toBe(false);
    expect(status.headline).toBe('Not showing yet — No ticket tiers are enabled');
    const tiers = status.checks.find((c) => c.id === 'tiers')!;
    expect(tiers.detail).toContain('Ticket information is being prepared.');
    expect(tiers.action).toEqual({ label: 'Add ticket tier', href: `/admin/events/${id}/tickets/tiers` });
  });

  it('reports the first problem in public-page order', () => {
    const status = ticketSetupStatus({ eventId: id, eventPublished: false, publicHref: '/tickets', contentStatus: 'MISSING', activeTiers: 0 });
    expect(blocking(status)).toEqual(['event-published', 'tickets-content', 'tiers']);
    expect(status.headline).toBe('Not showing yet — Event is not published');
    expect(status.checks[1]).toMatchObject({ title: 'Tickets page content has not been created', action: { label: 'Create content', href: `/admin/events/${id}/tickets/content` } });
  });
});

describe('ticketSetupStatus with an external seller', () => {
  it('is live without tiers when a provider link is set, and says so', () => {
    const status = ticketSetupStatus({ eventId: id, eventPublished: true, publicHref: '/tickets', contentStatus: 'PUBLISHED', activeTiers: 0, providerReady: true });
    expect(status.live).toBe(true);
    expect(status.checks.find((c) => c.id === 'tiers')?.title).toBe('Tickets sold through an external provider');
  });
  it('still blocks without tiers or provider, and mentions the provider option', () => {
    const status = ticketSetupStatus({ eventId: id, eventPublished: true, publicHref: '/tickets', contentStatus: 'PUBLISHED', activeTiers: 0, providerReady: false });
    expect(status.live).toBe(false);
    expect(status.checks.find((c) => c.id === 'tiers')?.detail).toContain('provider link in Ticket Settings');
  });
});

describe('vipSetupStatus', () => {
  const ready: VipFacts = { eventId: id, eventPublished: true, publicHref: '/tables', vipEnabled: true, bookingEnabled: true, tablesContentStatus: 'PUBLISHED', bookingContentStatus: 'PUBLISHED', activePackages: 1, defaultPackage: 'ok', activeBooths: 12 };

  it('is live when every public condition holds', () => {
    const status = vipSetupStatus(ready);
    expect(status.live).toBe(true);
    expect(status.checks.every((c) => c.level === 'ok')).toBe(true);
  });

  it('matches "VIP package details are being prepared" for no package or a disabled default', () => {
    for (const facts of [{ ...ready, activePackages: 0 }, { ...ready, defaultPackage: 'disabled' as const }, { ...ready, defaultPackage: 'missing' as const }]) {
      const status = vipSetupStatus(facts);
      expect(status.live).toBe(false);
      expect(status.checks.find((c) => c.id === 'packages')?.detail).toContain('VIP package details are being prepared.');
    }
    expect(vipSetupStatus({ ...ready, activePackages: 0 }).checks.find((c) => c.id === 'packages')?.action?.href).toBe(`/admin/events/${id}/vip/packages`);
    expect(vipSetupStatus({ ...ready, defaultPackage: 'disabled' }).checks.find((c) => c.id === 'packages')?.action?.href).toBe(`/admin/events/${id}/vip`);
  });

  it('puts VIP switched off before missing content, and keeps booths/booking as warnings', () => {
    const status = vipSetupStatus({ ...ready, vipEnabled: false, tablesContentStatus: 'DRAFT', activeBooths: 0, bookingEnabled: false });
    expect(status.headline).toBe('Not showing yet — VIP is switched off');
    expect(status.checks.filter((c) => c.level === 'warning').map((c) => c.id)).toEqual(['booths', 'booking']);
    expect(status.checks.find((c) => c.id === 'tables-content')?.action?.label).toBe('Publish content');
  });
});
