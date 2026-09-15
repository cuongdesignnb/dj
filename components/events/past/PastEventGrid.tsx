'use client';

import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import { eventsStagger } from '@/lib/animations';
import { matchesPastFilter } from '@/lib/events/listing-types';
import type { PastEventFilter, PastEventSummary } from '@/lib/events/listing-types';
import EventsSectionHeading from '../EventsSectionHeading';
import { useEventsFilter } from '../EventsFilterProvider';
import PastEventCard from './PastEventCard';

const GRID_ID = 'event-archive-grid';

export default function PastEventGrid({ events }: { events: PastEventSummary[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const { filter } = useEventsFilter<PastEventFilter>();

  const visible = useMemo(
    () => events.filter((event) => matchesPastFilter(event, filter)),
    [events, filter],
  );

  return (
    <section
      ref={ref}
      id="event-archive"
      aria-labelledby="event-archive-title"
      className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
    >
      <Container>
        <EventsSectionHeading title="EVENT ARCHIVE" titleId="event-archive-title" />

        <p aria-live="polite" className="sr-only">
          {visible.length === 1 ? '1 archive entry shown' : `${visible.length} archive entries shown`}
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
              <PastEventCard key={event.id} event={event} />
            ))}
          </motion.div>
        ) : (
          <div
            id={GRID_ID}
            className="mt-9 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
          >
            <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              Our event archive is being prepared.
            </p>
            <p className="mt-3 text-sm text-rave-muted sm:text-base">
              Past event recaps and galleries will appear here.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}

export { GRID_ID };
