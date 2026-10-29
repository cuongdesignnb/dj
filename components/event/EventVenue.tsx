'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Calendar, Clock, ExternalLink, MapPin, Navigation } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import { formatDateChip, formatTimeChip } from '@/lib/events/presentation';
import type { EventPageData } from '@/lib/events/types';
import RichText from '@/components/shared/RichText';

interface Props {
  event: EventPageData;
}

/** Everything Google needs to find the venue: name, street address, city. */
export function venueQuery(venue: { name: string; address: string | null; city: string }) {
  return [venue.name, venue.address, venue.city].filter(Boolean).join(', ');
}

export default function EventVenue({ event }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const e = event.event;
  const v = e.venue;
  const query = venueQuery(v);
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  const mapsHref = v.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <section
      id="venue"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-deep"
      aria-labelledby="venue-title"
    >
      <Container>
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: live map of the venue */}
          <motion.div
            variants={cardItem}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="lg:col-span-7 order-2 lg:order-1"
          >
            <div data-venue-map="" className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-rave-panel">
              {query ? (
                <iframe
                  title={`Map of ${v.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
                  className="absolute inset-0 h-full w-full border-0 [filter:grayscale(0.35)_contrast(1.05)]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                data-venue-directions=""
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgb(var(--rave-accent-rgb)/0.35)] transition hover:brightness-110"
              >
                <Navigation aria-hidden className="h-4 w-4" /> Get directions
                <span className="sr-only">(opens Google Maps in a new tab)</span>
              </a>
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10"
              >
                Open in Google Maps <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </motion.div>

          {/* Right: details */}
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 order-1 lg:order-2"
          >
            <EventSectionHeading eyebrow="Venue" title="The Venue" id="venue-title" align="left" />

            {v.image && (
              <motion.div variants={lineReveal} className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-white/[0.08]">
                <Image
                  src={v.image.src}
                  alt={v.image.alt || v.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  style={{ objectPosition: v.image.objectPosition ?? 'center' }}
                />
              </motion.div>
            )}

            <motion.h3 variants={lineReveal} className="font-heading text-2xl sm:text-3xl font-black uppercase text-white mt-6">
              {[v.name, v.city].filter(Boolean).join(', ')}
            </motion.h3>

            <motion.ul variants={lineReveal} className="mt-5 flex flex-col gap-3">
              {v.address && (
                <li className="flex items-start gap-3">
                  <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" />
                  <span className="text-sm text-white uppercase font-heading tracking-wider">{v.address}</span>
                </li>
              )}
              <li className="flex items-center gap-3">
                <Calendar aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                <span className="text-sm text-white uppercase font-heading tracking-wider">{formatDateChip(e.startsAt, e.timeZone)}</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                <span className="text-sm text-white uppercase font-heading tracking-wider">{formatTimeChip(e.startsAt, e.endsAt, e.timeZone)}</span>
              </li>
            </motion.ul>

            {v.description && (
              <motion.div variants={lineReveal} className="text-sm text-rave-muted mt-5 leading-relaxed">
                <RichText text={v.description} />
              </motion.div>
            )}

            {v.directions && (
              <motion.div variants={lineReveal} className="mt-5 rounded-xl border border-white/[0.08] bg-rave-panel/60 p-4">
                <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-rave-red">Getting there</p>
                <div className="mt-2 text-sm leading-relaxed text-rave-muted">
                  <RichText text={v.directions} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
