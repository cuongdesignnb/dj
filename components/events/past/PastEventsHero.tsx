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
import Container from '@/components/ui/Container';
import { eventHeroLineReveal, eventsReveal, eventsStagger } from '@/lib/animations';
import type { PastEventsHeroData } from '@/lib/events/listing-types';
import EventAction from '../EventAction';
import EventsBreadcrumb from '../EventsBreadcrumb';
import PastEventFilters from './PastEventFilters';

export default function PastEventsHero({
  hero,
  breadcrumb,
  filterLabel,
  filterOptions,
}: {
  hero: PastEventsHeroData;
  breadcrumb?: string;
  filterLabel?: string;
  filterOptions?: string[];
}) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  // Pointer tilt, desktop only — touch devices never fire mousemove.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [2, -2]), { stiffness: 90, damping: 16 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-3, 3]), { stiffness: 90, damping: 16 });

  return (
    <>
      <EventsBreadcrumb
        trail={[{ label: 'Home', href: '/' }, { label: 'Events', href: '/events' }, { label: breadcrumb ?? hero.breadcrumb ?? 'Past' }]}
      />

      <section
        ref={ref}
        aria-labelledby="past-hero-title"
        className="relative isolate overflow-hidden bg-rave-black pb-16 pt-6 md:pb-24 md:pt-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(255,23,61,0.16), transparent 55%), radial-gradient(circle at 90% 80%, rgba(139,44,255,0.10), transparent 60%)',
          }}
        />

        <Container>
          <motion.div
            variants={eventsStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-14"
          >
            <div className="lg:col-span-7">
              <motion.span
                variants={eventsReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-rave-red sm:text-sm"
              >
                {hero.eyebrow}
              </motion.span>

              <motion.h1
                id="past-hero-title"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="mt-4 font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[64px]"
              >
                {hero.titleLines.map((line, i) => (
                  <span key={line} className="block overflow-hidden">
                    <motion.span variants={eventHeroLineReveal} className="block">
                      {line}
                      {i < hero.titleLines.length - 1 && ' '}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={eventsReveal}
                className="mt-6 max-w-2xl text-base leading-relaxed text-rave-muted md:text-lg"
              >
                {hero.description}
              </motion.p>

              <motion.div variants={eventsReveal} className="mt-7 flex flex-wrap items-start gap-3">
                <EventAction action={hero.primaryCta} />
                {hero.secondaryCta && <EventAction action={hero.secondaryCta} tone="secondary" />}
              </motion.div>

              <motion.div variants={eventsReveal} className="mt-8">
                <PastEventFilters
                  controls="event-archive-grid"
                  label={filterLabel}
                  optionLabels={filterOptions}
                />
              </motion.div>
            </div>

            <motion.div variants={eventsReveal} className="lg:col-span-5">
              <motion.div
                ref={visualRef}
                style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1000 }}
                onMouseMove={(e) => {
                  if (reduced) return;
                  const rect = visualRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
                  tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
                }}
                onMouseLeave={() => {
                  tiltX.set(0);
                  tiltY.set(0);
                }}
                className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-white/[0.08] shadow-[0_30px_80px_rgba(255,23,61,0.18)] sm:aspect-[5/6]"
              >
                <Image
                  src={hero.visual.src}
                  alt={hero.visual.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(3,3,5,0.30) 0%, rgba(3,3,5,0) 30%, rgba(3,3,5,0.65) 100%), linear-gradient(120deg, rgba(255,23,61,0.18), rgba(139,44,255,0.10) 60%, transparent 100%)',
                    mixBlendMode: 'screen',
                  }}
                />

                {hero.visualAnnotations?.side && hero.visualAnnotations.side.length > 0 && (
                  <div
                    aria-hidden
                    className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2 rounded-l-xl bg-gradient-to-l from-black/70 to-transparent py-3 pl-6 pr-2 text-right font-heading text-[10px] uppercase tracking-[0.22em] text-white/85 sm:right-5 sm:text-xs"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                  >
                    {hero.visualAnnotations.side.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                )}

                {hero.visualAnnotations?.note && hero.visualAnnotations.note.length > 0 && (
                  <div
                    aria-hidden
                    className="absolute bottom-4 right-4 flex flex-col gap-1 text-right font-heading text-[10px] uppercase tracking-[0.22em] text-white/75 sm:text-xs"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                  >
                    {hero.visualAnnotations.note.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </div>
                )}

                {!reduced && (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.16) 50%, transparent 65%)',
                    }}
                    initial={{ x: '-120%' }}
                    animate={inView ? { x: '120%' } : { x: '-120%' }}
                    transition={{ duration: 1.5, delay: 0.7, ease: 'easeInOut' }}
                  />
                )}

                {!reduced && (
                  <motion.div
                    aria-hidden
                    className="absolute -inset-2 -z-10 rounded-[24px] blur-2xl"
                    style={{
                      background:
                        'radial-gradient(60% 60% at 50% 50%, rgba(255,23,61,0.45), transparent 70%)',
                    }}
                    animate={inView ? { opacity: [0.35, 0.55, 0.35] } : { opacity: 0 }}
                    transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
