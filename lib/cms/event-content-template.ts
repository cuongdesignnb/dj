import { eventScopedHref } from '@/lib/events/event-scope';

/**
 * Starting drafts for event-scoped page content (`tickets:<id>`, `tables:<id>`,
 * `booking:<id>`). Events created after seeding have no content row yet; the
 * admin editor opens this neutral draft so an editor can review it and save it
 * into the database. Nothing here is rendered publicly until it is published.
 */
export type EventContentKind = 'tickets' | 'tables' | 'booking' | 'event';

export interface EventContentTemplateEvent {
  title: string;
  slug: string;
}

const EVENT_CONTENT_KEY = /^(tickets|tables|booking|event):(.+)$/;

export function parseEventContentKey(key: string): { kind: EventContentKind; eventId: string } | null {
  const match = EVENT_CONTENT_KEY.exec(key);
  return match ? { kind: match[1] as EventContentKind, eventId: match[2] } : null;
}

const action = (label: string, href: string) => ({ label, href });
const seo = (title: string, description: string) => ({ title, description, ogImage: null, index: true, follow: true });

export function eventContentTemplate(kind: EventContentKind, event: EventContentTemplateEvent): Record<string, unknown> {
  const title = event.title.trim() || event.slug;
  const eventHref = `/events/${encodeURIComponent(event.slug)}`;

  if (kind === 'event') {
    return {
      highlights: [],
      expectations: [],
      experience: { image: null, captions: ['Good music', 'Good people', 'Brighter tomorrow'] },
      goodToKnow: [],
      venue: { image: null, description: '', directions: '' },
      organiser: { name: '', description: '', website: '', instagram: '', facebook: '' },
      finalCta: { title: `Ready for ${title}?`, subtitle: 'Secure your tickets and get ready for the night.' },
    };
  }

  if (kind === 'tickets') {
    return {
      hero: { breadcrumb: 'Tickets', eyebrow: title, title: 'Choose your ticket', description: `Ticket information for ${title}.`, image: null, sideNotes: [], footNotes: [] },
      selector: { eyebrow: 'Ticket Options', title: 'Ticket Options', description: 'Choose the option that fits your night.', aside: '', emptyTitle: 'Ticket information is being prepared.', emptyDescription: 'Please check back for the latest release details.' },
      trustItems: [],
      infoItems: [],
      faq: [],
      provider: { unavailableNote: 'The ticket provider link will be published when confirmed by the organiser.' },
      finalCta: { title, subtitle: 'Event details and updates are on the event page.', primary: action('View event', eventHref), secondary: action('Contact us', '/contact'), background: null },
      footer: { email: null, phone: null, legalTermsHref: '/terms', legalPrivacyHref: '/privacy' },
      seo: seo(`${title} Tickets | Connection Rave`, `Ticket information for ${title}.`),
    };
  }

  if (kind === 'tables') {
    return {
      hero: { breadcrumb: 'VIP Tables', eyebrow: title, titleLine1: 'VIP Tables', titleLine2: title, description: `Premium booths and bottle service at ${title}.`, image: null, sideNotes: [], footNotes: [] },
      map: { eyebrow: 'Club Map', title: 'Choose your view', description: 'Explore the illustrative club map and tell us which area you prefer.', disclaimer: 'Booth positions are indicative. A request is not a reservation.', stageLabel: 'STAGE', background: null },
      infoTitle: 'VIP Information',
      infoContext: title,
      faqContext: 'VIP questions',
      infoItems: [],
      faq: [],
      finalCta: { title: 'Request a VIP booth', subtitle: 'Share your preferred setup and the team will confirm availability.', primary: action('Request a booth', eventScopedHref('/book-now', event.slug)), secondary: action('View event', eventHref), background: null },
      seo: seo(`${title} VIP Tables | Connection Rave`, `VIP table and bottle information for ${title}.`),
    };
  }

  return {
    hero: { breadcrumb: 'Booking', eyebrow: title, titleLine1: 'VIP Booking', titleLine2: 'Request', description: `Submit your details and preferred VIP setup for ${title}. The team will review your request and confirm availability directly.`, image: null, sideNotes: [], footNotes: [] },
    tabs: { tickets: 'Tickets', vip: 'VIP Table' },
    form: { heading: 'Tell us about your night', description: 'We will use these details to prepare your VIP booking request.', nameLabel: 'Full name', emailLabel: 'Email', phoneLabel: 'Phone', groupSizeLabel: 'Group size', boothLabel: 'Preferred booth', bottleLabel: 'Bottle options', specialRequestLabel: 'Special requests', submitLabel: 'Send booking request' },
    bookingNotes: [],
    notesTitle: 'Booking Notes',
    notesContext: 'Good To Know',
    processSteps: [],
    faq: [],
    faqContext: 'VIP questions',
    finalCta: { title, subtitle: 'Event details and updates are on the event page.', primary: action('View event', eventHref), secondary: action('Contact us', '/contact'), background: null },
    seo: seo(`${title} VIP Booking Request | Connection Rave`, `Send a VIP table booking request for ${title}.`),
  };
}
