'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EventFilter } from '@/lib/events/listing-types';

interface EventsFilterContextValue {
  filter: EventFilter;
  setFilter: (next: EventFilter) => void;
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
 */
export default function EventsFilterProvider({
  initialFilter = 'all',
  children,
}: {
  initialFilter?: EventFilter;
  children: ReactNode;
}) {
  const [filter, setFilterState] = useState<EventFilter>(initialFilter);

  const setFilter = useCallback((next: EventFilter) => {
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

export function useEventsFilter(): EventsFilterContextValue {
  const context = useContext(EventsFilterContext);
  if (!context) {
    throw new Error('useEventsFilter must be used inside EventsFilterProvider');
  }
  return context;
}
