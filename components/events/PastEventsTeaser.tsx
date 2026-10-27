'use client';

import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import { NavigationLink as Link } from '@/components/shared/NavigationFeedback';
import EventsSectionHeading from '@/components/events/EventsSectionHeading';
import PastEventCard from '@/components/events/past/PastEventCard';
import type { PastEventSummary } from '@/lib/events/listing-types';

/** Finished events sit below the upcoming ones, most recent first, linking to the full archive. */
export default function PastEventsTeaser({ events }: { events: PastEventSummary[] }) {
  if (events.length === 0) return null;
  return (
    <section id="past-events" aria-labelledby="past-events-title" data-past-events="" className="relative bg-rave-black py-16 md:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <EventsSectionHeading eyebrow="ARCHIVE" title="PAST EVENTS" titleId="past-events-title" context="The nights we remember" />
          <Link
            href="/events/past"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[12px] border border-white/20 px-5 font-heading text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red/60"
          >
            View all past events <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          {events.slice(0, 4).map((event) => <PastEventCard key={event.id} event={event} />)}
        </div>
      </Container>
    </section>
  );
}
