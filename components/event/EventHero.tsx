'use client';

import Image from 'next/image';
import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Calendar, Clock, Music2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventActionButton from './EventActionButton';
import EventSectionHeading from './EventSectionHeading';
import {
  formatDateChip,
  formatTimeChip,
  resolveTicketsAction,
  resolveVipAction,
} from '@/lib/events/presentation';
import {
  heroStagger,
  lineReveal,
  cardStagger,
  cardItem,
} from '@/lib/events/motion';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

interface EventHeroProps {
  event: EventPageData;
  routes: FrontendRoutes;
}

function TiltPoster({
  src,
  alt,
  width,
  height,
  priority,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority: boolean;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const supportsHover =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 26 });
  const sy = useSpring(y, { stiffness: 260, damping: 26 });
  const rotateY = useTransform(sx, [-0.5, 0.5], ['-4deg', '4deg']);
  const rotateX = useTransform(sy, [-0.5, 0.5], ['4deg', '-4deg']);
  const glareX = useTransform(sx, [-0.5, 0.5], ['30%', '70%']);
  const glareY = useTransform(sy, [-0.5, 0.5], ['30%', '70%']);

  const onMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current || reduced || !supportsHover) return;
      const rect = ref.current.getBoundingClientRect();
      x.set((e.clientX - rect.left) / rect.width - 0.5);
      y.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [x, y, reduced, supportsHover],
  );
  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  // Light sweep overlay — pure CSS animation, runs once per hover
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        onLeave();
        setHover(false);
      }}
      onMouseEnter={() => setHover(true)}
      style={{
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative"
    >
      <motion.div
        variants={cardItem}
        initial="hidden"
        animate="visible"
        className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-rave-red/40 shadow-[0_0_40px_rgba(255,23,61,0.25)] bg-rave-panel"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          sizes="(max-width: 1024px) 90vw, 40vw"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Subtle darkening on hover for readability */}
        <div
          aria-hidden
          className="absolute inset-0 bg-rave-black/0 transition-colors duration-300"
          style={{ backgroundColor: hover ? 'rgba(0,0,0,0.18)' : 'transparent' }}
        />

        {/* Glare overlay */}
        {!reduced && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              opacity: hover ? 1 : 0,
              background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.25), transparent 55%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Light sweep on hover */}
        {!reduced && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ opacity: hover ? 1 : 0, transition: 'opacity 200ms' }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: 'translateX(-100%)',
                animation: hover ? 'eventSweep 700ms ease-out forwards' : 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 48%, rgba(255,23,61,0.32) 52%, rgba(255,255,255,0.18) 56%, transparent 75%)',
                }}
              />
            </div>
          </div>
        )}

        {/* Edge glow that intensifies on hover */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset transition-shadow duration-300"
          style={{
            boxShadow: hover
              ? 'inset 0 0 60px rgba(255,23,61,0.4), 0 0 60px rgba(255,23,61,0.35)'
              : 'inset 0 0 30px rgba(255,23,61,0.18)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function EventHero({ event, routes }: EventHeroProps) {
  const reduced = useReducedMotion();
  const e = event.event;
  const bg = e.heroBackground;
  const tickets = resolveTicketsAction(e, routes);
  const vip = resolveVipAction(e, routes);

  // Ambient light drift — pausable and reduced-motion aware.
  const lightDriftEnabled = !reduced;
  useEffect(() => {
    if (!lightDriftEnabled) return;
  }, [lightDriftEnabled]);

  return (
    <section
      className="relative isolate overflow-hidden pt-[120px] pb-16 md:pb-24"
      aria-labelledby="event-hero-title"
    >
      {/* Background image (dim) */}
      {bg && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={bg.src}
            alt=""
            fill
            priority={false}
            sizes="100vw"
            className="object-cover opacity-40"
            style={{ objectPosition: bg.objectPosition ?? 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-rave-black/85 via-rave-black/70 to-rave-black" />
        </div>
      )}

      {/* Ambient lights */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-40 w-[520px] h-[520px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(255,23,61,0.18), transparent 70%)' }}
          animate={
            lightDriftEnabled
              ? { x: [0, 40, -10, 0], y: [0, 30, -20, 0], opacity: [0.45, 0.7, 0.5, 0.45] }
              : undefined
          }
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(139,44,255,0.15), transparent 70%)' }}
          animate={
            lightDriftEnabled
              ? { x: [0, -30, 20, 0], y: [0, -20, 30, 0], opacity: [0.35, 0.55, 0.4, 0.35] }
              : undefined
          }
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, rgba(46,107,255,0.10), transparent 70%)' }}
          animate={
            lightDriftEnabled
              ? { opacity: [0.3, 0.5, 0.3] }
              : undefined
          }
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      <Container>
        <motion.div
          variants={heroStagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
        >
          {/* Poster column */}
          {e.poster ? (
            <div className="lg:col-span-5 order-1">
              <TiltPoster
                src={e.poster.src}
                alt={e.poster.alt}
                width={e.poster.width}
                height={e.poster.height}
                priority
              />
            </div>
          ) : (
            <div className="lg:col-span-5 order-1 aspect-[3/4] rounded-2xl border border-white/10 bg-rave-panel grid place-items-center text-center p-8">
              <span className="font-heading uppercase tracking-[0.2em] text-rave-muted text-sm">
                Poster coming soon
              </span>
            </div>
          )}

          {/* Info column */}
          <motion.div
            variants={cardStagger}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 order-2 flex flex-col gap-6"
          >
            <motion.span
              variants={lineReveal}
              className="font-heading uppercase tracking-[0.3em] text-xs sm:text-sm text-rave-red font-bold"
            >
              METRO CITY, PERTH
            </motion.span>

            <motion.h1
              id="event-hero-title"
              variants={lineReveal}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black uppercase leading-[0.95] text-white"
            >
              {e.title}
            </motion.h1>

            <motion.p
              variants={lineReveal}
              className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl"
            >
              {e.intro}
            </motion.p>

            <motion.p
              variants={lineReveal}
              className="font-heading uppercase tracking-[0.18em] text-base md:text-lg text-rave-red font-bold"
            >
              {e.accentLine}
            </motion.p>

            {/* Date/time chips */}
            <motion.div
              variants={lineReveal}
              className="flex flex-wrap gap-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm text-white">
                <Calendar className="w-4 h-4 text-rave-red" />
                <span className="font-heading uppercase tracking-wider">
                  {formatDateChip(e.startsAt, e.timeZone)}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm text-white">
                <Clock className="w-4 h-4 text-rave-red" />
                <span className="font-heading uppercase tracking-wider">
                  {formatTimeChip(e.startsAt, e.endsAt, e.timeZone)}
                </span>
              </span>
            </motion.div>

            {/* Genre chips */}
            {e.genres?.length > 0 && (
              <motion.div variants={lineReveal} className="flex flex-wrap gap-2">
                {e.genres.map((g) => (
                  <span
                    key={g}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rave-red/30 bg-rave-red/5 px-3.5 py-1.5 text-xs sm:text-sm font-heading uppercase tracking-wider text-white"
                  >
                    <Music2 className="w-3.5 h-3.5 text-rave-red" />
                    {g}
                  </span>
                ))}
              </motion.div>
            )}

            {/* CTAs */}
            <motion.div variants={lineReveal} className="flex flex-wrap gap-3 pt-2">
              <EventActionButton
                action={tickets}
                variant="primary"
                label="Get Tickets"
                reducedMotion={!!reduced}
              />
              <EventActionButton
                action={vip}
                variant="secondary"
                label="Explore VIP Tables"
                reducedMotion={!!reduced}
              />
            </motion.div>

            {(tickets.note || vip.note) && (
              <motion.p
                variants={lineReveal}
                className="text-xs text-rave-muted/80"
              >
                {tickets.note ?? vip.note}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </Container>

      {/* Keyframes for light sweep — local to /event */}
      <style>{`
        @keyframes eventSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </section>
  );
}

// Re-export the heading component so other sections can compose it.
export { EventSectionHeading };
