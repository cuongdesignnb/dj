'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Globe, Users, Sparkles } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import type { EventPageData } from '@/lib/events/types';

const ICON_MAP = {
  globe: Globe,
  users: Users,
  music: () => null,
  sparkles: Sparkles,
  'map-pin': () => null,
  headphones: () => null,
} as const;

interface Props {
  event: EventPageData;
}

export default function EventAbout({ event }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const e = event.event;

  return (
    <section
      id="about"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-black"
      aria-labelledby="about-title"
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left: copy */}
          <motion.div
            ref={ref}
            variants={cardStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="lg:col-span-7"
          >
            <EventSectionHeading
              eyebrow="About"
              title="About the Event"
              id="about-title"
              align="left"
            />

            <div className="flex flex-col gap-5 mt-6">
              {e.aboutParagraphs.map((p, i) => (
                <motion.p
                  key={i}
                  variants={lineReveal}
                  className="text-white/85 text-base md:text-lg leading-relaxed"
                >
                  {p}
                </motion.p>
              ))}
            </div>
          </motion.div>

          {/* Right: feature cards */}
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4"
          >
            {e.highlights.length === 0 && (
              <p className="text-rave-muted">Highlights coming soon.</p>
            )}
            {e.highlights.map((h) => {
              const Icon = ICON_MAP[h.icon];
              return (
                <motion.article
                  key={h.id}
                  variants={cardItem}
                  className="relative rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-5 hover:border-rave-red/40 transition-colors duration-300 group"
                  whileHover={reduced ? undefined : { y: -4 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                >
                  <div className="flex items-start gap-4">
                    <motion.span
                      aria-hidden
                      className="w-11 h-11 shrink-0 rounded-xl bg-rave-red/10 border border-rave-red/30 flex items-center justify-center text-rave-red"
                      whileHover={reduced ? undefined : { y: -2, rotate: -3 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                    >
                      {Icon ? <Icon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    </motion.span>
                    <div className="flex flex-col gap-1.5">
                      <h3 className="font-heading uppercase tracking-[0.16em] text-sm font-bold text-white">
                        {h.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-rave-muted">
                        {h.description}
                      </p>
                    </div>
                  </div>
                  {/* Subtle accent line that lifts on hover */}
                  <span
                    aria-hidden
                    className="absolute left-5 right-5 -bottom-px h-px bg-gradient-to-r from-transparent via-rave-red/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
