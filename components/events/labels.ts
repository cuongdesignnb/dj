import type { EventStatus, EventSummary } from '@/lib/events/listing-types';

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
