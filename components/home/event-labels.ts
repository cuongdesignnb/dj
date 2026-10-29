import { eventDateText, eventScheduleText } from '@/lib/events/presentation';
import type { HomeEvent } from './types';

/** "Saturday 07 November 2026" once the date is confirmed in Admin, else null. */
export function homeEventDate(event: HomeEvent | null | undefined): string | null {
  return event && event.dateStatus.toUpperCase() === 'CONFIRMED' ? eventDateText(event.startAt) : null;
}

/** "09:00 pm – 04:00 am" once the schedule is confirmed in Admin, else null. */
export function homeEventSchedule(event: HomeEvent | null | undefined): string | null {
  return event && event.scheduleStatus.toUpperCase() === 'CONFIRMED' ? eventScheduleText(event.startAt, event.endAt) : null;
}

export function homeEventVenue(event: HomeEvent | null | undefined): string | null {
  return event ? [event.venue.name, event.venue.city].filter(Boolean).join(', ') || null : null;
}
