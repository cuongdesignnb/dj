// Presentation helpers: action resolution, date formatting, empty states, and
// the mapping from repository errors to user-facing messages.

import type { EventPageData, FrontendRoutes, RepositoryError } from './types';

export type ResolvedAction = {
  href: string;
  external: boolean;
  note?: string;
};

const DEFAULT_EVENT_TZ = process.env.EVENT_TIME_ZONE?.trim() || 'UTC';

function safeHref(value: string | null | undefined): ResolvedAction | null {
  if (!value) return null;
  // Internal paths only — external action URLs are validated at the
  // repository layer; here we only need to flag them.
  if (value.startsWith('/')) return { href: value, external: false };
  return { href: value, external: true };
}

export function resolveTicketsAction(
  event: EventPageData['event'],
  routes: FrontendRoutes,
): ResolvedAction {
  const direct = safeHref(event.actions.ticketUrl);
  if (direct) return direct;
  if (routes.tickets) return { href: routes.tickets, external: false };
  return { href: '/tickets', external: false };
}

export function resolveVipAction(
  event: EventPageData['event'],
  routes: FrontendRoutes,
): ResolvedAction {
  const direct = safeHref(event.actions.vipRequestUrl);
  if (direct) return direct;
  if (routes.tables) return { href: routes.tables, external: false };
  return { href: '/tables', external: false };
}

export function resolveBookedNowAction(
  _event: EventPageData['event'],
  routes: FrontendRoutes,
): ResolvedAction {
  if (routes.booking) return { href: routes.booking, external: false };
  return { href: '/tables', external: false };
}

export function resolveLineupAction(
  routes: FrontendRoutes,
): ResolvedAction | null {
  if (routes.lineup) return { href: routes.lineup, external: false };
  return null; // Caller should switch to expand-in-place.
}

export interface FormattedDate {
  label: string;
  fullLabel: string;
  subLabel?: string;
}

function parseIso(s: string): Date | null {
  // Accept ISO-8601 with offset or Z.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    return null;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatEventDate(
  startsAt: string | null,
  endsAt: string | null,
  doorsOpenAt: string | null,
  timeZone: string,
): FormattedDate {
  const tz = timeZone || DEFAULT_EVENT_TZ;
  if (!startsAt) {
    return { label: 'Date to be announced', fullLabel: 'Date to be announced' };
  }
  const startDate = parseIso(startsAt);
  if (!startDate) {
    return { label: 'Date to be announced', fullLabel: 'Date to be announced' };
  }
  const dateFmt = new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: tz,
  });
  const label = dateFmt.format(startDate);
  const lines: string[] = [label];

  const startTimeFmt = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  });

  if (doorsOpenAt) {
    const doors = parseIso(doorsOpenAt);
    if (doors) lines.push(`Doors open ${startTimeFmt.format(doors)}`);
  }

  if (endsAt) {
    const ends = parseIso(endsAt);
    if (ends) lines.push(`Ends ${startTimeFmt.format(ends)}`);
  }

  if (!doorsOpenAt && !endsAt) {
    return { label, fullLabel: lines.join(' · '), subLabel: 'Schedule to be confirmed' };
  }

  return { label, fullLabel: lines.join(' · ') };
}

export function formatDateChip(startsAt: string | null, timeZone: string): string {
  if (!startsAt) return 'Date to be announced';
  const d = parseIso(startsAt);
  if (!d) return 'Date to be announced';
  const fmt = timeZone
    ? new Intl.DateTimeFormat('en-AU', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone,
      })
    : new Intl.DateTimeFormat('en-AU', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: DEFAULT_EVENT_TZ });
  return fmt.format(d);
}

export function formatTimeChip(
  startsAt: string | null,
  endsAt: string | null,
  timeZone: string,
): string {
  if (!startsAt) return 'Schedule to be confirmed';
  const start = parseIso(startsAt);
  if (!start) return 'Schedule to be confirmed';
  const tz = timeZone || DEFAULT_EVENT_TZ;
  const timeFmt = new Intl.DateTimeFormat('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  });
  const startStr = timeFmt.format(start);
  if (!endsAt) return startStr;
  const end = parseIso(endsAt);
  if (!end) return startStr;
  return `${startStr} – ${timeFmt.format(end)}`;
}

export function repositoryErrorMessage(err: RepositoryError): string {
  switch (err.kind) {
    case 'not-found':
      return 'We could not find this event. It may have been moved or unpublished.';
    case 'http-error':
      return 'The event service is temporarily unavailable. Please try again in a moment.';
    case 'network-error':
      return 'We had trouble reaching the event service. Please check your connection and retry.';
    case 'invalid-payload':
      return 'The event response is in an unexpected format. The team has been notified.';
    case 'config-error':
      return 'The event page is misconfigured. Please contact the team.';
    default:
      return 'Something went wrong while loading this event.';
  }
}
