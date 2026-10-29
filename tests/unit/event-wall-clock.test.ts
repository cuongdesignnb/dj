import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventDateText, eventScheduleText } from '@/lib/events/presentation';
import { eventSchema } from '@/lib/seo/structured-data';

// Admin saves "7 Nov 2026, 21:00 – 8 Nov, 04:00" as 21:00Z / 04:00Z.
const start = '2026-11-07T21:00:00.000Z';
const end = '2026-11-08T04:00:00.000Z';

describe('event wall-clock display', () => {
  it('shows the date and times exactly as entered in Admin', () => {
    expect(eventDateText(start)).toBe('Saturday 07 November 2026');
    expect(eventScheduleText(start, end)).toBe('09:00 pm – 04:00 am');
    expect(eventScheduleText(start, null)).toBe('09:00 pm');
  });
  it('returns null rather than a raw string for missing or malformed values', () => {
    expect(eventDateText(null)).toBeNull();
    expect(eventDateText('soon')).toBeNull();
    expect(eventScheduleText(undefined, end)).toBeNull();
  });
});

describe('event structured data', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('keeps the entered clock and attaches the venue offset', () => {
    vi.stubEnv('EVENT_TIME_ZONE', 'Australia/Perth');
    const schema = eventSchema({ name: 'Hi-Land', path: '/events/hi-land-perth', startDate: start, endDate: end });
    expect(schema?.startDate).toBe('2026-11-07T21:00:00+08:00');
    expect(schema?.endDate).toBe('2026-11-08T04:00:00+08:00');
  });
  it('stays in UTC when no zone is configured', () => {
    vi.stubEnv('EVENT_TIME_ZONE', '');
    expect(eventSchema({ name: 'E', path: '/events/e', startDate: start })?.startDate).toBe(start);
  });
});
