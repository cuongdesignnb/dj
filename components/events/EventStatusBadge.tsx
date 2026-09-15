import type { EventSummary } from '@/lib/events/listing-types';
import { statusLabel } from './labels';

/**
 * Status pill shown on a card's artwork. Reads the event's own status, so a
 * placeholder can never be dressed up as an announced event.
 */
export default function EventStatusBadge({
  event,
  className = '',
}: {
  event: EventSummary;
  className?: string;
}) {
  const label = statusLabel(event);
  const isFeatured = event.featured;

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 font-heading text-[10px] uppercase tracking-[0.2em] font-semibold backdrop-blur-sm sm:text-[11px] ${
        isFeatured
          ? 'border-rave-red/70 bg-rave-red/15 text-white shadow-[0_0_16px_rgba(255,23,61,0.3)]'
          : 'border-white/20 bg-black/55 text-white/85'
      } ${className}`}
    >
      {label}
    </span>
  );
}
