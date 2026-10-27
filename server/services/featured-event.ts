import 'server-only';

import { unstable_cache } from 'next/cache';
import { db } from '@/server/db/client';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';
import { upcomingEventWhere } from '@/server/services/public';

/** Used when nothing is chosen in Admin, or the database is unreachable (e.g. `next build`). */
export const FALLBACK_EVENT_SLUG = 'destiny';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function id(value: unknown): string | null {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value.trim()) ? value.trim() : null;
}

const loadFeaturedEventSlug = unstable_cache(
  async (): Promise<string> => {
    const [home, setting] = await Promise.all([
      db.contentPage.findUnique({ where: { slug: 'home' }, include: { translations: true } }),
      db.siteSetting.findUnique({ where: { key: 'site.default_event_id' } }),
    ]);
    const translation = home?.translations.find((row) => row.locale === 'en') ?? home?.translations[0];
    const candidates = [id(record(record(translation?.contentJson).hero).eventId), id(setting?.valueJson)].filter((value): value is string => Boolean(value));
    for (const eventId of candidates) {
      // A choice that is already past (e.g. DESTINY) is skipped so the homepage moves on.
      const event = await db.event.findFirst({ where: { id: eventId, status: 'PUBLISHED', deletedAt: null, ...upcomingEventWhere() }, select: { slug: true } });
      if (event) return event.slug;
    }
    // Nothing chosen: the next upcoming published event (featured first, soonest first).
    const next = await db.event.findFirst({
      where: { status: 'PUBLISHED', deletedAt: null, ...upcomingEventWhere() },
      // Ties (no date, not featured) keep the longest-standing event rather than jumping to the newest.
      orderBy: [{ featured: 'desc' }, { startAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      select: { slug: true },
    });
    return next?.slug ?? FALLBACK_EVENT_SLUG;
  },
  ['featured-event-slug-v1'],
  // Saving Homepage content or Settings revalidates `site`/`home`; saving an event revalidates `events`/`home`.
  { tags: [PUBLIC_CACHE_TAGS.site, PUBLIC_CACHE_TAGS.home, PUBLIC_CACHE_TAGS.events], revalidate: 300 },
);

/**
 * The current event: Admin › Content › Homepage › Hero › "Current event", else
 * Admin › Settings › Site › "Featured event", else the next upcoming published
 * event, else DESTINY. Only a published, not-yet-past event
 * counts. The homepage shows it and /tickets, /tables, /book-now and /event use it
 * when no `?event=` is given.
 */
export async function getFeaturedEventSlug(): Promise<string> {
  try {
    return await loadFeaturedEventSlug();
  } catch {
    return FALLBACK_EVENT_SLUG;
  }
}
