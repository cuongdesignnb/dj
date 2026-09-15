'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import { eventsStagger } from '@/lib/animations';
import { matchesFilter } from '@/lib/events/listing-types';
import type { EventSummary } from '@/lib/events/listing-types';
import EventCard from './EventCard';
import EventsSectionHeading from './EventsSectionHeading';
import { useEventsFilter } from './EventsFilterProvider';

const GRID_ID = 'all-events-grid';

export default function EventGrid({ events }: { events: EventSummary[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { filter } = useEventsFilter();

  const visible = useMemo(
    () => events.filter((event) => matchesFilter(event, filter)),
    [events, filter],
  );

  return (
    <section
      ref={ref}
      id="all-events"
      aria-labelledby="all-events-title"
      className="relative bg-rave-black py-16 md:py-24"
    >
      <Container>
        <EventsSectionHeading title="ALL EVENTS" titleId="all-events-title" />

        {/* Announces the result of a filter change to screen readers. */}
        <p aria-live="polite" className="sr-only">
          {visible.length === 1 ? '1 event shown' : `${visible.length} events shown`}
        </p>

        {visible.length > 0 ? (
          <motion.div
            id={GRID_ID}
            // Remounting on filter change replays the stagger for the new set.
            key={filter}
            variants={eventsStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
          >
            {visible.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </motion.div>
        ) : (
          <div
            id={GRID_ID}
            className="mt-9 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
          >
            <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              New events are being prepared.
            </p>
            <p className="mt-3 text-sm text-rave-muted sm:text-base">
              Stay connected for the next announcement.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}

export { GRID_ID };
