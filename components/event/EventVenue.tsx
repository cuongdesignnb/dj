'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import {
  formatDateChip,
  formatTimeChip,
} from '@/lib/events/presentation';
import type { EventPageData } from '@/lib/events/types';

interface Props {
  event: EventPageData;
}

export default function EventVenue({ event }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const e = event.event;
  const v = e.venue;

  return (
    <section
      id="venue"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-deep"
      aria-labelledby="venue-title"
    >
      <Container>
        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left: image */}
          <motion.div
            variants={cardItem}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            transition={{ delay: 0 }}
            className="lg:col-span-7 order-1"
          >
            <motion.div
              whileHover={reduced ? undefined : { y: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/[0.08] bg-rave-panel"
            >
              {v.image ? (
                <Image
                  src={v.image.src}
                  alt={v.image.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover"
                  style={{ objectPosition: v.image.objectPosition ?? 'center' }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-center px-8 bg-gradient-to-br from-rave-panel via-rave-panel2 to-rave-panel">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-rave-muted font-heading uppercase tracking-[0.25em] text-xs">
                      Venue Image
                    </span>
                    <span className="text-white font-heading uppercase tracking-wider text-xl">
                      Coming Soon
                    </span>
                    <span className="text-rave-muted text-xs">
                      Photos of {v.name} will be revealed closer to the event.
                    </span>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-rave-black/55 to-transparent" />
              <div className="absolute left-5 bottom-5 flex flex-col gap-1 text-xs uppercase tracking-[0.18em] text-white/70 font-heading">
                <span>Music</span>
                <span>Culture</span>
                <span>People</span>
                <span>{v.city}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: details */}
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 order-2"
          >
            <EventSectionHeading
              eyebrow="Venue"
              title="The Venue"
              id="venue-title"
              align="left"
            />

            <motion.h3
              variants={lineReveal}
              className="font-heading text-2xl sm:text-3xl font-black uppercase text-white mt-6"
            >
              {v.name}, {v.city}
            </motion.h3>

            <motion.div
              variants={lineReveal}
              className="flex flex-col gap-3 mt-5"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-rave-red" />
                <span className="text-sm text-white uppercase font-heading tracking-wider">
                  {formatDateChip(e.startsAt, e.timeZone)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-rave-red" />
                <span className="text-sm text-white uppercase font-heading tracking-wider">
                  {formatTimeChip(e.startsAt, e.endsAt, e.timeZone)}
                </span>
              </div>
            </motion.div>

            {v.address && (
              <motion.p
                variants={lineReveal}
                className="text-sm text-rave-muted mt-5 leading-relaxed"
              >
                {v.address}
              </motion.p>
            )}

            <motion.p
              variants={lineReveal}
              className="text-sm text-rave-muted mt-3 leading-relaxed"
            >
              {v.description}
            </motion.p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
