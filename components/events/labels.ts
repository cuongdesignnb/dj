import type {
  ArchiveContentType,
  EventStatus,
  EventSummary,
  PastEventSummary,
} from '@/lib/events/listing-types';

/**
 * Display labels derived from an event's status fields.
 *
 * Kept in one place so a card, the featured block and any future detail page
 * describe the same event identically — and so nothing about a date or a
 * ticket release can be written directly into a component.
 */

export function dateLabel(event: EventSummary): string {
  if (event.dateStatus === 'confirmed' && event.date) return event.date;
  return event.placeholder ? 'Details to be announced' : 'Date to be announced';
}

export function scheduleLabel(event: EventSummary): string {
  if (event.scheduleStatus === 'confirmed' && event.schedule) return event.schedule;
  if (event.placeholder) return event.description ?? 'Stay tuned for the next drop';
  return 'Schedule to be confirmed';
}

const STATUS_LABELS: Record<EventStatus, string> = {
  announced: 'Announced',
  'coming-soon': 'Coming Soon',
  'tickets-available': 'Tickets Available',
  'sold-out': 'Sold Out',
  completed: 'Past Event',
};

/** Featured wins over the raw status, matching how the badge reads in the design. */
export function statusLabel(event: EventSummary): string {
  if (event.featured) return 'Featured';
  return STATUS_LABELS[event.status];
}

export function statusLabelText(status: EventStatus): string {
  return STATUS_LABELS[status];
}

// --- Archive (/events/past) ---------------------------------------------

/**
 * Formats a stored ISO date for display.
 *
 * Fixed to en-AU with an explicit UTC time zone so the server and the client
 * produce the same string — a locale-dependent format here would be a
 * hydration mismatch waiting to happen.
 */
export function archiveDateLabel(event: PastEventSummary): string {
  if (!event.startDate) return 'Date to be confirmed';
  const parsed = new Date(event.startDate);
  if (Number.isNaN(parsed.getTime())) return 'Date to be confirmed';
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

export function archiveLocationLabel(event: PastEventSummary): string {
  return event.location ?? 'Location to be confirmed';
}

const CONTENT_TYPE_LABELS: Record<ArchiveContentType, string> = {
  recap: 'Event Recap',
  gallery: 'Gallery Available',
  highlights: 'Artist Highlights',
};

export function contentTypeLabel(type: ArchiveContentType): string {
  return CONTENT_TYPE_LABELS[type];
}

/**
 * Badge text for an archive card, derived from what content actually exists
 * rather than asserted by the component.
 */
export function archiveBadgeLabel(event: PastEventSummary): string {
  if (event.contentTypes.includes('gallery')) return 'Gallery';
  if (event.contentTypes.includes('recap')) return 'Recap';
  return 'Archived';
}
