'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, CalendarDays, Clock, MapPin } from 'lucide-react';
import type { EventSummary } from '@/lib/events/listing-types';
import { eventsReveal } from '@/lib/animations';
import ComingSoonEventVisual from './ComingSoonEventVisual';
import EventAction from './EventAction';
import EventStatusBadge from './EventStatusBadge';
import { dateLabel, scheduleLabel } from './labels';

interface EventCardProps {
  event: EventSummary;
}

/**
 * One event in the ALL EVENTS grid.
 *
 * Every label comes from the event's own status fields — nothing about a date,
 * a line-up or ticket availability is asserted by the card itself.
 */
export default function EventCard({ event }: EventCardProps) {
  const reduced = useReducedMotion();
  const isPlaceholder = event.placeholder === true;
  const titleLines = event.title.split('\n');

  return (
    // The article carries the scroll reveal (hidden/visible, driven by the
    // grid's stagger). Hover is a separate rest/hover cycle on the wrapper
    // inside it, so the two never fight over the same variant names.
    <motion.article variants={eventsReveal} className="group @container">
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={reduced ? undefined : 'hover'}
        whileFocus={reduced ? undefined : 'hover'}
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -8, scale: 1.012 } }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-rave-panel/80 transition-[border-color,box-shadow] duration-300 hover:border-rave-red/50 hover:shadow-[0_22px_60px_rgba(255,23,61,0.22)] focus-within:border-rave-red/50 @[27rem]:flex-row"
      >
        {/* Visual */}
        <div className="relative w-full shrink-0 overflow-hidden @[27rem]:w-[44%]">
          <div className="relative aspect-[4/5] w-full @[27rem]:aspect-auto @[27rem]:h-full @[27rem]:min-h-[280px]">
            {isPlaceholder || !event.image.src ? (
              <ComingSoonEventVisual />
            ) : (
              <motion.div
                variants={{ rest: { scale: 1 }, hover: { scale: reduced ? 1 : 1.04 } }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0"
              >
                <Image
                  src={event.image.src}
                  alt={event.image.alt}
                  fill
                  loading="lazy"
                  sizes="(max-width: 767px) 100vw, (max-width: 1280px) 50vw, 300px"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(3,3,5,0.15) 0%, rgba(3,3,5,0) 45%, rgba(3,3,5,0.55) 100%)',
                  }}
                />
              </motion.div>
            )}

            <div className="absolute left-3 top-3 z-10">
              <EventStatusBadge event={event} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          {event.location && (
            <p className="flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-[0.2em] text-rave-red">
              <MapPin aria-hidden className="h-3.5 w-3.5" />
              {event.location}
            </p>
          )}

          <h3 className="font-heading text-2xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-[26px]">
            {titleLines.map((line, i) => (
              <span key={`${line}-${i}`} className="block">
                {line}
                {i < titleLines.length - 1 && ' '}
              </span>
            ))}
          </h3>

          <dl className="flex flex-col gap-2 text-sm text-rave-muted">
            <div className="flex items-center gap-2">
              <dt className="sr-only">Date</dt>
              <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red/80" />
              <dd>{dateLabel(event)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="sr-only">Schedule</dt>
              <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red/80" />
              <dd>{scheduleLabel(event)}</dd>
            </div>
          </dl>

          {event.genres.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {event.genres.map((genre) => (
                <li
                  key={genre}
                  className="rounded-lg border border-white/[0.10] bg-white/[0.03] px-2.5 py-1 font-heading text-[11px] uppercase tracking-[0.12em] text-rave-muted"
                >
                  {genre}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-auto pt-3">
            {event.detailHref ? (
              <EventAction
                action={{ label: 'View Event', href: event.detailHref }}
                fullWidth
              />
            ) : event.notificationAction ? (
              <EventAction
                action={event.notificationAction}
                tone="secondary"
                fullWidth
                icon={<Bell aria-hidden className="h-4 w-4" />}
              />
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
