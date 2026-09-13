'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Music, Sparkles, Users, MapPin } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import type { EventPageData } from '@/lib/events/types';

const ICON_MAP = {
  globe: MapPin,
  users: Users,
  music: Music,
  sparkles: Sparkles,
  'map-pin': MapPin,
  headphones: MapPin,
} as const;

interface Props {
  event: EventPageData;
}

export default function EventExpectations({ event }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const e = event.event;
  const img = e.experienceImage ?? e.heroBackground;

  return (
    <section
      id="expect"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-deep"
      aria-labelledby="expect-title"
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: image */}
          <motion.div
            variants={lineReveal}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="lg:col-span-6"
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08]">
              {img ? (
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  style={{ objectPosition: img.objectPosition ?? 'center' }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-rave-panel text-rave-muted text-sm">
                  Event image coming soon
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-rave-black/55 via-transparent to-transparent" />
              {/* Bottom caption */}
              <div className="absolute left-4 bottom-4 right-4 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/70 font-heading">
                <span>Good music</span>
                <span>Good people</span>
                <span>Brighter tomorrow</span>
              </div>
            </div>
          </motion.div>

          {/* Right: title + cards */}
          <div ref={ref} className="lg:col-span-6">
            <EventSectionHeading
              eyebrow="Experience"
              title="What to Expect"
              id="expect-title"
              align="left"
            />

            <motion.div
              variants={cardStagger}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"
            >
              {e.expectations.length === 0 && (
                <p className="text-rave-muted">Expectations coming soon.</p>
              )}
              {e.expectations.map((card) => {
                const Icon = ICON_MAP[card.icon];
                return (
                  <motion.article
                    key={card.id}
                    variants={cardItem}
                    whileHover={reduced ? undefined : { y: -4 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                    className="group rounded-2xl border border-white/[0.08] bg-rave-panel/70 p-5 hover:border-rave-red/40 transition-colors duration-300"
                  >
                    <motion.span
                      aria-hidden
                      className="inline-flex w-10 h-10 rounded-lg bg-rave-red/10 border border-rave-red/30 items-center justify-center text-rave-red mb-3"
                      whileHover={reduced ? undefined : { y: -2 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </motion.span>
                    <h3 className="font-heading uppercase tracking-[0.18em] text-sm font-bold text-white mb-1">
                      {card.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-rave-muted">
                      {card.description}
                    </p>
                  </motion.article>
                );
              })}
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}
