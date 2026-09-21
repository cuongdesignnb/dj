'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { CalendarDays, Clock, MapPin, Ticket } from 'lucide-react';
import Container from '@/components/ui/Container';
import { eventImageReveal, eventsReveal, eventsStagger } from '@/lib/animations';
import type { EventSummary } from '@/lib/events/listing-types';
import type { PublicListingEmptyState, PublicListingSection } from '@/lib/cms/public-page';
import ListingEmptyState from '@/components/shared/ListingEmptyState';
import EventAction from './EventAction';
import EventsSectionHeading from './EventsSectionHeading';
import { dateLabel, scheduleLabel } from './labels';

export default function FeaturedEvent({
  event,
  section,
  emptyState,
}: {
  event: EventSummary | null | undefined;
  section?: PublicListingSection;
  emptyState?: PublicListingEmptyState;
}) {
  const ref = useRef<HTMLElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  // Desktop-only pointer tilt. Touch devices never fire mousemove, so the
  // poster simply sits still there.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [2, -2]), {
    stiffness: 90,
    damping: 16,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 90,
    damping: 16,
  });

  if (!event) {
    return (
      <section
        ref={ref}
        aria-labelledby="featured-event-title"
        className="bg-rave-black py-16 md:py-24"
      >
        <Container>
          <EventsSectionHeading
            eyebrow={section?.eyebrow}
            title={section?.title ?? 'FEATURED EVENT'}
            titleId="featured-event-title"
            context={section?.description}
          />
          <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-12 text-center">
            <ListingEmptyState
              state={emptyState}
              fallbackTitle="No featured event right now."
              fallbackDescription="Stay connected for the next announcement."
            />
          </div>
        </Container>
      </section>
    );
  }

  const titleLines = event.title.split('\n');

  return (
    <section
      ref={ref}
      aria-labelledby="featured-event-title"
      className="relative bg-rave-black py-16 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 50% at 20% 30%, rgba(255,23,61,0.10), transparent 60%)',
        }}
      />

      <Container>
        <EventsSectionHeading
          eyebrow={section?.eyebrow}
          title={section?.title ?? 'FEATURED EVENT'}
          titleId="featured-event-title"
          context={section?.description}
        />

        <motion.div
          variants={eventsStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 items-center gap-8 md:grid-cols-2 lg:gap-12"
        >
          {/* Poster */}
          <motion.div
            ref={posterRef}
            variants={eventImageReveal}
            style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
            onMouseMove={(e) => {
              if (reduced) return;
              const rect = posterRef.current?.getBoundingClientRect();
              if (!rect) return;
              pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
              pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
            }}
            onMouseLeave={() => {
              pointerX.set(0);
              pointerY.set(0);
            }}
            className="relative aspect-[4/5] overflow-hidden rounded-[18px] border border-rave-red/30 shadow-[0_30px_80px_rgba(255,23,61,0.22)]"
          >
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-cover"
            />
          </motion.div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            <motion.div variants={eventsReveal}>
              <span className="inline-flex items-center rounded-lg border border-rave-red/70 bg-rave-red/12 px-3 py-1.5 font-heading text-[11px] uppercase tracking-[0.22em] font-semibold text-white">
                Featured Event
              </span>
            </motion.div>

            {event.location && (
              <motion.p
                variants={eventsReveal}
                className="flex items-center gap-2 font-heading text-xs uppercase tracking-[0.24em] text-rave-red sm:text-sm"
              >
                <MapPin aria-hidden className="h-4 w-4" />
                {event.location}
              </motion.p>
            )}

            <motion.div variants={eventsReveal}>
              <h3 className="font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-6xl">
                {titleLines.map((line, i) => (
                  <span key={`${line}-${i}`} className="block">
                    {line}
                    {i < titleLines.length - 1 && ' '}
                  </span>
                ))}
              </h3>
              {event.subtitle && (
                <p className="mt-2 font-heading text-sm uppercase tracking-[0.34em] text-rave-muted sm:text-base">
                  {event.subtitle}
                </p>
              )}
            </motion.div>

            <motion.dl variants={eventsReveal} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <dt className="sr-only">Date</dt>
                <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                <dd className="text-sm text-rave-muted">{dateLabel(event)}</dd>
              </div>
              <div className="flex items-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <dt className="sr-only">Schedule</dt>
                <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                <dd className="text-sm text-rave-muted">{scheduleLabel(event)}</dd>
              </div>
            </motion.dl>

            {event.genres.length > 0 && (
              <motion.ul variants={eventsStagger} className="flex flex-wrap gap-2.5">
                {event.genres.map((genre) => (
                  <motion.li
                    key={genre}
                    variants={{
                      hidden: { opacity: 0, scale: 0.94 },
                      visible: { opacity: 1, scale: 1, transition: { duration: 0.35 } },
                    }}
                    className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-1.5 font-heading text-xs uppercase tracking-[0.14em] text-rave-muted"
                  >
                    {genre}
                  </motion.li>
                ))}
              </motion.ul>
            )}

            {event.description && (
              <motion.p variants={eventsReveal} className="max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base">
                {event.description}
              </motion.p>
            )}

            <motion.div variants={eventsReveal} className="flex flex-wrap items-start gap-3 pt-1">
              {event.detailHref && (
                <EventAction action={{ label: 'View Event', href: event.detailHref }} />
              )}
              <EventAction
                action={{
                  label: 'Get Tickets',
                  href: event.ticketHref ?? null,
                  unavailableNote: event.ticketHref ? undefined : 'Ticket release to be announced',
                }}
                tone="secondary"
                icon={<Ticket aria-hidden className="h-4 w-4" />}
              />
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
