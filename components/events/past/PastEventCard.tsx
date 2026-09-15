'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, Images, MapPin } from 'lucide-react';
import type { PastEventSummary } from '@/lib/events/listing-types';
import { eventsReveal } from '@/lib/animations';
import EventAction from '../EventAction';
import { archiveBadgeLabel, archiveDateLabel, archiveLocationLabel } from '../labels';
import ArchiveEventVisual from './ArchiveEventVisual';

/**
 * One entry in the EVENT ARCHIVE grid.
 *
 * Date, location and badge all come from the entry's own fields, so an entry
 * with nothing recorded shows "to be confirmed" rather than an invented value.
 */
export default function PastEventCard({ event }: { event: PastEventSummary }) {
  const reduced = useReducedMotion();
  const badge = archiveBadgeLabel(event);

  // Prefer the gallery when one exists, otherwise the recap. Both may be null,
  // in which case the action renders as unavailable instead of linking nowhere.
  const primaryAction = event.galleryHref
    ? { label: 'View Gallery', href: event.galleryHref }
    : event.recapHref
      ? { label: 'Open Recap', href: event.recapHref }
      : event.contentTypes.includes('gallery')
        ? { label: 'View Gallery', href: null, unavailableNote: 'Gallery coming soon' }
        : { label: 'Open Recap', href: null, unavailableNote: 'Recap coming soon' };

  return (
    <motion.article variants={eventsReveal} className="group @container">
      <motion.div
        initial="rest"
        animate="rest"
        whileHover={reduced ? undefined : 'hover'}
        whileFocus={reduced ? undefined : 'hover'}
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -8, scale: 1.012 } }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="relative flex h-full flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-rave-panel/80 transition-[border-color,box-shadow] duration-300 focus-within:border-rave-red/50 hover:border-rave-red/50 hover:shadow-[0_22px_60px_rgba(255,23,61,0.22)] @[27rem]:flex-row"
      >
        {/* Visual */}
        <div className="relative w-full shrink-0 overflow-hidden @[27rem]:w-[44%]">
          <div className="relative aspect-[4/5] w-full @[27rem]:aspect-auto @[27rem]:h-full @[27rem]:min-h-[280px]">
            {event.image.src ? (
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
              </motion.div>
            ) : (
              <ArchiveEventVisual
                title={event.isPlaceholder && !event.location ? undefined : event.title}
                subtitle={event.subtitle}
              />
            )}

            <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-lg border border-white/20 bg-black/55 px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85 backdrop-blur-sm sm:text-[11px]">
              {badge}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
          <p className="flex items-center gap-1.5 font-heading text-[11px] uppercase tracking-[0.2em] text-rave-red">
            <MapPin aria-hidden className="h-3.5 w-3.5" />
            {archiveLocationLabel(event)}
          </p>

          <h3 className="font-heading text-2xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-[26px]">
            {event.title}
          </h3>

          {event.excerpt && (
            <p className="text-sm leading-relaxed text-rave-muted">{event.excerpt}</p>
          )}

          <p className="flex items-center gap-2 text-sm text-rave-muted">
            <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red/80" />
            {archiveDateLabel(event)}
          </p>

          <div className="mt-auto pt-3">
            <EventAction
              action={primaryAction}
              fullWidth
              icon={
                primaryAction.label === 'View Gallery' ? (
                  <Images aria-hidden className="h-4 w-4" />
                ) : undefined
              }
            />
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
