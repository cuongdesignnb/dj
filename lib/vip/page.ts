import 'server-only';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { VIP_UNAVAILABLE_MESSAGE, getVipRepository } from './repository';
import { getFeaturedEventSlug } from '@/server/services/featured-event';
import type { VipPageState } from './types';
import { eventScopeFromSearchParams } from '@/lib/events/event-scope';

/**
 * One normalization per SSR request, shared with metadata; fetch tags remain
 * authoritative. Pass the same `eventSlug` (null = default event) from metadata
 * and page so React's cache key matches.
 */
export const loadVipPage = cache(async (eventSlug: string | null, currentSlug: string): Promise<VipPageState> => {
  const repository = getVipRepository(eventSlug ?? currentSlug);
  const loaded: VipPageState = repository.ok ? await repository.repository.getVipPage()
    : { kind: 'service-unavailable', message: repository.error.message };
  // Only `?event=` pages distinguish a missing event; the default event keeps its original closed state.
  const state: VipPageState = !eventSlug && loaded.kind === 'event-not-found' ? { kind: 'service-unavailable', message: VIP_UNAVAILABLE_MESSAGE } : loaded;
  if (state.kind !== 'ready') {
    const reason = {
      'vip-disabled': 'vip_disabled', 'booking-disabled': 'booking_disabled',
      'no-active-package': 'no_active_package', 'no-booths': 'no_booths', 'no-availability': 'no_availability',
      'not-configured': 'page_content_missing', 'invalid-response': 'invalid_payload', 'service-unavailable': 'network_failure', 'event-not-found': 'event_not_found',
    }[state.kind];
    console.info('[vip-page]', { reason });
  }
  return state;
});

export type PageSearchParams = { [key: string]: string | string[] | undefined };

/**
 * Resolves `?event=<slug>` for /tables and /book-now. No parameter (or the
 * default event's own slug) keeps today's default-event page; a malformed or
 * unknown slug is a 404 rather than a misleading "service unavailable".
 */
export async function loadScopedVipPage(searchParams: Promise<PageSearchParams>) {
  const params = await searchParams;
  const scope = eventScopeFromSearchParams(params);
  if (scope.kind === 'invalid') notFound();
  const currentSlug = await getFeaturedEventSlug();
  const eventSlug = scope.kind === 'event' && scope.slug !== currentSlug ? scope.slug : null;
  const result = await loadVipPage(eventSlug, currentSlug);
  if (eventSlug && result.kind === 'event-not-found') notFound();
  return { params, eventSlug, result };
}
