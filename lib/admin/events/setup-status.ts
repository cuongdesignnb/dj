/**
 * Plain-language setup checklist for an event's public Tickets / VIP pages.
 * Checks run in the same order the public pages decide what to show, so the
 * first failing check is exactly what visitors see.
 */

export type SetupMode = 'tickets' | 'vip';
export type CheckLevel = 'ok' | 'blocking' | 'warning';

export interface SetupCheck {
  id: string;
  level: CheckLevel;
  /** What the admin needs to know, phrased as the current state. */
  title: string;
  /** What visitors see because of it, or what to do. */
  detail: string;
  action: { label: string; href: string } | null;
}

export interface SetupStatus {
  mode: SetupMode;
  /** True when the public page shows real ticket / package details. */
  live: boolean;
  headline: string;
  publicHref: string;
  checks: SetupCheck[];
}

type ContentStatus = string; // PUBLISHED | DRAFT | MISSING | …

export interface TicketFacts {
  eventId: string;
  eventPublished: boolean;
  publicHref: string;
  contentStatus: ContentStatus;
  activeTiers: number;
  /** External seller (e.g. TicketsCandy) switched on with a link. */
  providerReady?: boolean;
}

export interface VipFacts {
  eventId: string;
  eventPublished: boolean;
  publicHref: string;
  vipEnabled: boolean;
  bookingEnabled: boolean;
  tablesContentStatus: ContentStatus;
  bookingContentStatus: ContentStatus;
  activePackages: number;
  defaultPackage: 'none' | 'missing' | 'disabled' | 'ok';
  activeBooths: number;
}

const adminEvent = (eventId: string, path = 'edit') => `/admin/events/${eventId}/${path}`;

function check(id: string, level: CheckLevel, title: string, detail: string, action: SetupCheck['action'] = null): SetupCheck {
  return { id, level, title, detail, action };
}

function eventCheck(facts: { eventId: string; eventPublished: boolean }) {
  return facts.eventPublished
    ? check('event-published', 'ok', 'Event is published', 'Visitors can open this event.')
    : check('event-published', 'blocking', 'Event is not published', 'Visitors cannot open this event yet, so its pages show nothing.', { label: 'Publish event', href: adminEvent(facts.eventId) });
}

function contentCheck(id: string, name: string, status: ContentStatus, href: string, missingEffect: string) {
  if (status === 'PUBLISHED') return check(id, 'ok', `${name} is published`, 'Headings, FAQ and notes are live.');
  const state = status === 'MISSING' ? 'has not been created' : 'is not published';
  return check(id, 'blocking', `${name} ${state}`, missingEffect, { label: status === 'MISSING' ? 'Create content' : 'Publish content', href });
}

function summarise(mode: SetupMode, publicHref: string, checks: SetupCheck[], liveHeadline: string): SetupStatus {
  const firstBlocking = checks.find((item) => item.level === 'blocking');
  return {
    mode,
    live: !firstBlocking,
    headline: firstBlocking ? `Not showing yet — ${firstBlocking.title}` : liveHeadline,
    publicHref,
    checks,
  };
}

export function ticketSetupStatus(facts: TicketFacts): SetupStatus {
  const checks = [
    eventCheck(facts),
    contentCheck('tickets-content', 'Tickets page content', facts.contentStatus, adminEvent(facts.eventId, 'tickets/content'),
      'The Tickets page says "Ticket information for this event has not been published yet."'),
    facts.activeTiers === 0 && facts.providerReady
      ? check('tiers', 'ok', 'Tickets sold through an external provider', 'The Tickets page shows a Buy tickets button that opens the provider.', { label: 'Ticket settings', href: adminEvent(facts.eventId, 'tickets') })
      : facts.activeTiers > 0
      ? check('tiers', 'ok', `${facts.activeTiers} ticket tier${facts.activeTiers === 1 ? '' : 's'} enabled`, 'Shown as ticket options on the Tickets page.', { label: 'Edit tiers', href: adminEvent(facts.eventId, 'tickets/tiers') })
      : check('tiers', 'blocking', 'No ticket tiers are enabled', 'The Tickets page says "Ticket information is being prepared." Add a tier and switch Enabled on, or add the provider link in Ticket Settings if tickets are sold elsewhere.', { label: 'Add ticket tier', href: adminEvent(facts.eventId, 'tickets/tiers') }),
  ];
  return summarise('tickets', facts.publicHref, checks, 'Showing ticket options on the site');
}

export function vipSetupStatus(facts: VipFacts): SetupStatus {
  const settings = adminEvent(facts.eventId, 'vip');
  const checks = [
    eventCheck(facts),
    facts.vipEnabled
      ? check('vip-enabled', 'ok', 'VIP is enabled', 'The VIP Tables page is open for this event.', { label: 'VIP settings', href: settings })
      : check('vip-enabled', 'blocking', 'VIP is switched off', 'The VIP Tables page says "VIP table information is not available yet." Turn on "VIP enabled".', { label: 'Turn on VIP', href: settings }),
    contentCheck('tables-content', 'VIP Tables page content', facts.tablesContentStatus, adminEvent(facts.eventId, 'vip/tables-content'),
      'The VIP Tables page says "VIP page information is being prepared."'),
    contentCheck('booking-content', 'Booking page content', facts.bookingContentStatus, adminEvent(facts.eventId, 'vip/booking-content'),
      'The VIP Tables and Book Now pages say "VIP page information is being prepared."'),
  ];
  if (facts.activePackages === 0) {
    checks.push(check('packages', 'blocking', 'No VIP package is enabled', 'The VIP Tables page says "VIP package details are being prepared." Add a package and switch Enabled on.', { label: 'Add VIP package', href: adminEvent(facts.eventId, 'vip/packages') }));
  } else if (facts.defaultPackage === 'missing' || facts.defaultPackage === 'disabled') {
    checks.push(check('packages', 'blocking', facts.defaultPackage === 'missing' ? 'The default package no longer exists' : 'The default package is switched off',
      'The VIP Tables page says "VIP package details are being prepared." Pick an enabled package as the default, or enable it.', { label: 'Choose default package', href: settings }));
  } else {
    checks.push(check('packages', 'ok', `${facts.activePackages} VIP package${facts.activePackages === 1 ? '' : 's'} enabled`, 'Package details are shown on the VIP Tables page.', { label: 'Edit packages', href: adminEvent(facts.eventId, 'vip/packages') }));
  }
  if (facts.activeBooths === 0) {
    checks.push(check('booths', 'warning', 'No booths on the club map', 'Visitors cannot pick a booth. Request-only packages can still send a request without one.', { label: 'Add booths', href: adminEvent(facts.eventId, 'vip/booths') }));
  }
  if (!facts.bookingEnabled) {
    checks.push(check('booking', 'warning', 'Booking requests are switched off', 'Visitors can read about VIP tables but cannot send a booking request.', { label: 'VIP settings', href: settings }));
  }
  return summarise('vip', facts.publicHref, checks, 'Showing VIP packages on the site');
}
