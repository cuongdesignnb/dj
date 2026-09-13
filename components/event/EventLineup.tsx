'use client';

import Image from 'next/image';
import { useState, useCallback, useRef, useId } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { cardStagger, cardItem, lineReveal } from '@/lib/events/motion';
import { resolveLineupAction, type ResolvedAction } from '@/lib/events/presentation';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

interface Props {
  event: EventPageData;
  routes: FrontendRoutes;
}

const COUNTRY_FLAGS: Record<string, string> = {
  VIETNAM: '🇻🇳',
  SINGAPORE: '🇸🇬',
  AUSTRALIA: '🇦🇺',
};

export default function EventLineup({ event, routes }: Props) {
  const lineupAction: ResolvedAction | null = resolveLineupAction(routes);
  const all = event.event.artists;
  const initialCount = Math.min(4, all.length);
  const [expanded, setExpanded] = useState(all.length <= initialCount);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const region = useId();
  const list = expanded ? all : all.slice(0, initialCount);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <section
      id="lineup"
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-black"
      aria-labelledby="lineup-title"
    >
      <Container>
        <div className="flex flex-col gap-2 mb-10">
          <EventSectionHeading
            eyebrow="Lineup"
            title="Lineup Preview"
            id="lineup-title"
            align="left"
          />
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="font-heading uppercase tracking-[0.2em] text-xs text-rave-muted">
              International Sounds · Local Energy
            </span>
          </div>
        </div>

        <motion.div
          ref={ref}
          variants={cardStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5"
        >
          {list.length === 0 && (
            <p className="text-rave-muted col-span-full">Lineup to be announced.</p>
          )}
          {list.map((artist) => {
            const flag = COUNTRY_FLAGS[artist.country] ?? '🌐';
            const card = (
              <motion.article
                variants={cardItem}
                whileHover={reduced ? undefined : { y: -5 }}
                transition={{ type: 'spring', stiffness: 240, damping: 24 }}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-rave-panel/60 hover:border-rave-red/45 transition-colors duration-300"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-rave-deep">
                  {artist.portrait ? (
                    <Image
                      src={artist.portrait.src}
                      alt={artist.portrait.alt}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      style={{ objectPosition: artist.portrait.objectPosition ?? '50% 30%' }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-rave-purple/20 to-rave-red/20 grid place-items-center text-rave-muted text-sm">
                      Portrait coming soon
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-rave-black/80 via-rave-black/30 to-transparent" />
                  {/* Tinted overlay on hover */}
                  <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        'linear-gradient(120deg, rgba(255,23,61,0.18) 0%, rgba(139,44,255,0.16) 60%, transparent 100%)',
                      mixBlendMode: 'screen',
                    }}
                  />
                  <div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-bold uppercase tracking-[0.18em] text-white">
                      <span aria-hidden className="text-base leading-none">
                        {flag}
                      </span>
                      {artist.country}
                    </span>
                    <h3 className="font-heading uppercase tracking-wider text-base sm:text-lg md:text-xl font-black text-white drop-shadow">
                      {artist.name}
                    </h3>
                  </div>
                </div>
              </motion.article>
            );
            if (artist.profileHref) {
              return (
                <a
                  key={`${region}-${artist.id}`}
                  href={artist.profileHref}
                  className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red rounded-2xl"
                >
                  {card}
                </a>
              );
            }
            return <div key={`${region}-${artist.id}`}>{card}</div>;
          })}
        </motion.div>

        <div className="flex justify-center mt-10">
          {lineupAction ? (
            <motion.a
              href={lineupAction.href}
              variants={lineReveal}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] border border-rave-red/55 text-white font-heading uppercase tracking-wider text-sm sm:text-base hover:bg-rave-red/10 hover:border-rave-red transition-all duration-300"
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
            >
              View Full Lineup
              <ChevronDown className="w-4 h-4" />
            </motion.a>
          ) : all.length > initialCount ? (
            <motion.button
              type="button"
              onClick={toggle}
              aria-expanded={expanded}
              aria-controls="lineup-grid"
              variants={lineReveal}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] border border-rave-red/55 text-white font-heading uppercase tracking-wider text-sm sm:text-base hover:bg-rave-red/10 hover:border-rave-red transition-all duration-300"
              whileHover={reduced ? undefined : { y: -2 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
            >
              {expanded ? 'Show Less' : 'View Full Lineup'}
              <motion.span
                aria-hidden
                animate={expanded ? { rotate: 180 } : { rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="inline-flex"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </motion.button>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
