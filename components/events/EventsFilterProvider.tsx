'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EventFilter } from '@/lib/events/listing-types';

interface EventsFilterContextValue<T extends string = string> {
  filter: T;
  setFilter: (next: T) => void;
}

const EventsFilterContext = createContext<EventsFilterContextValue | null>(null);

/**
 * Holds the active listing filter for the whole page.
 *
 * The filter bar lives in the hero and the grid it controls sits several
 * sections below, so the state has to be shared. This provider is a thin
 * client boundary: the sections it wraps are still rendered by the server and
 * passed through as children, so `/events` does not become a client page.
 *
 * The URL is kept in sync with the native history API rather than
 * `router.replace`, which would re-run the server render on every chip click.
 *
 * The filter itself is just a string here so both /events and /events/past can
 * share this; each page keeps its own union type at the call sites.
 */
export default function EventsFilterProvider<T extends string = EventFilter>({
  initialFilter,
  children,
}: {
  initialFilter?: T;
  children: ReactNode;
}) {
  const [filter, setFilterState] = useState<string>(initialFilter ?? 'all');

  const setFilter = useCallback((next: string) => {
    setFilterState(next);

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', next);
    }
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, []);

  const value = useMemo(() => ({ filter, setFilter }), [filter, setFilter]);

  return <EventsFilterContext.Provider value={value}>{children}</EventsFilterContext.Provider>;
}

export function useEventsFilter<T extends string = EventFilter>(): EventsFilterContextValue<T> {
  const context = useContext(EventsFilterContext);
  if (!context) {
    throw new Error('useEventsFilter must be used inside EventsFilterProvider');
  }
  return context as unknown as EventsFilterContextValue<T>;
}
