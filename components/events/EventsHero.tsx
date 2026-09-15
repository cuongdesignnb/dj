'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Container from '@/components/ui/Container';
import EventsFilters from './EventsFilters';
import EventAction from './EventAction';
import { eventsReveal, eventsStagger, eventHeroLineReveal } from '@/lib/animations';
import type { EventsHeroData } from '@/lib/events/listing-types';

interface Props {
  hero: EventsHeroData;
}

export default function EventsHero({ hero }: Props) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  // 3D tilt (desktop only — mobile disabled).
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [2, -2]), { stiffness: 90, damping: 16 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-3, 3]), { stiffness: 90, damping: 16 });

  return (
    <>
      <motion.nav
        aria-label="Breadcrumb"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-[100px] sm:pt-[108px] bg-rave-black"
      >
        <Container>
          <ol className="flex items-center gap-2 text-xs sm:text-sm font-heading uppercase tracking-[0.18em] text-rave-muted">
            <li>
              <Link href="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-rave-muted/60">/</li>
            <li aria-current="page" className="text-rave-red">
              Events
            </li>
          </ol>
        </Container>
      </motion.nav>

      <section
        ref={ref}
        className="relative isolate overflow-hidden pt-6 pb-16 md:pt-8 md:pb-24 bg-rave-black"
        aria-labelledby="events-hero-title"
      >
        <div
          aria-hidden
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 12% 18%, rgba(255,23,61,0.16), transparent 55%), radial-gradient(circle at 90% 80%, rgba(46,107,255,0.10), transparent 60%)',
          }}
        />

        <Container>
          <motion.div
            variants={eventsStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
          >
            <div className="lg:col-span-7">
              <motion.span
                variants={eventsReveal}
                className="font-heading uppercase tracking-[0.28em] text-xs sm:text-sm text-rave-red font-semibold"
              >
                {hero.eyebrow}
              </motion.span>

              <motion.h1
                id="events-hero-title"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black uppercase leading-[1.02] tracking-tight text-white mt-4"
              >
                {hero.titleLines.map((line, i) => (
                  <span key={line} className="block overflow-hidden">
                    <motion.span variants={eventHeroLineReveal} className="block">
                      {line}
                      {/* Keeps the accessible name from running the lines together. */}
                      {i < hero.titleLines.length - 1 && ' '}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={eventsReveal}
                className="text-rave-muted text-base md:text-lg leading-relaxed mt-6 max-w-2xl"
              >
                {hero.description}
              </motion.p>

              <motion.div
                variants={eventsReveal}
                className="flex flex-wrap items-center gap-3 mt-7"
              >
                <EventAction action={hero.primaryCta} />
                {hero.secondaryCta && <EventAction action={hero.secondaryCta} tone="secondary" />}
              </motion.div>

              <motion.div variants={eventsReveal} className="mt-8">
                <EventsFilters controls="all-events-grid" />
              </motion.div>
            </div>

            <motion.div variants={eventsReveal} className="lg:col-span-5">
              <motion.div
                ref={visualRef}
                style={reduced ? undefined : { rotateX: rotX, rotateY: rotY }}
                onMouseMove={(e) => {
                  if (reduced) return;
                  const rect = visualRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const px = (e.clientX - rect.left) / rect.width - 0.5;
                  const py = (e.clientY - rect.top) / rect.height - 0.5;
                  tiltX.set(px);
                  tiltY.set(py);
                }}
                onMouseLeave={() => {
                  if (reduced) return;
                  tiltX.set(0);
                  tiltY.set(0);
                }}
                className="relative aspect-[4/5] sm:aspect-[5/6] overflow-hidden rounded-[20px] border border-white/[0.08] shadow-[0_30px_80px_rgba(255,23,61,0.18)]"
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
                      'linear-gradient(180deg, rgba(3,3,5,0.30) 0%, rgba(3,3,5,0) 30%, rgba(3,3,5,0.65) 100%), linear-gradient(120deg, rgba(255,23,61,0.18), rgba(46,107,255,0.10) 60%, transparent 100%)',
                    mixBlendMode: 'screen',
                  }}
                />
                {hero.visualAnnotations?.side && hero.visualAnnotations.side.length > 0 && (
                  <div
                    aria-hidden
                    className="absolute top-1/2 right-3 sm:right-5 -translate-y-1/2 flex flex-col gap-2 rounded-l-xl bg-gradient-to-l from-black/70 to-transparent py-3 pl-6 pr-2 font-heading uppercase tracking-[0.22em] text-[10px] sm:text-xs text-white/85 text-right"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                  >
                    {hero.visualAnnotations.side.map((line) => (
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
