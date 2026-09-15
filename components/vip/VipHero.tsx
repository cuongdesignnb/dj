'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight, CalendarDays, Clock, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import type { Crumb } from '@/components/events/EventsBreadcrumb';
import { eventHeroLineReveal, vipReveal, vipStagger } from '@/lib/animations';
import type { VipEventContext } from '@/lib/vip/types';

export interface VipHeroAction {
  label: string;
  href: string;
  icon?: ReactNode;
  tone?: 'primary' | 'secondary';
}

/**
 * Hero shared by /tables and /book-now so both pages open identically — same
 * metadata chips, same editorial side copy, same motion.
 */
export default function VipHero({
  crumbs,
  eyebrow,
  titleLines,
  description,
  event,
  actions,
  sideNotes,
  footNotes,
  titleId,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  titleLines: string[];
  description: string;
  event: VipEventContext;
  actions?: VipHeroAction[];
  sideNotes: string[];
  footNotes?: string[];
  titleId: string;
  /** Extra controls between the description and the metadata chips. */
  children?: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotX = useSpring(useTransform(tiltY, [-0.5, 0.5], [2, -2]), { stiffness: 90, damping: 16 });
  const rotY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-3, 3]), { stiffness: 90, damping: 16 });

  const meta = [
    {
      Icon: CalendarDays,
      label: event.dateStatus === 'confirmed' && event.date ? event.date : 'Date to be announced',
    },
    {
      Icon: Clock,
      label:
        event.scheduleStatus === 'confirmed' && event.schedule
          ? event.schedule
          : 'Schedule to be confirmed',
    },
    { Icon: MapPin, label: event.venue },
  ];

  return (
    <>
      <EventsBreadcrumb trail={crumbs} />

      <section
        ref={ref}
        aria-labelledby={titleId}
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
            variants={vipStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12"
          >
            <div className="lg:col-span-6">
              <motion.span
                variants={vipReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-rave-red sm:text-sm"
              >
                {eyebrow}
              </motion.span>

              <motion.h1
                id={titleId}
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
                }}
                className="mt-4 font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl md:text-6xl"
              >
                {titleLines.map((line, i) => (
                  <span key={line} className="block overflow-hidden">
                    <motion.span variants={eventHeroLineReveal} className="block">
                      {line}
                      {i < titleLines.length - 1 && ' '}
                    </motion.span>
                  </span>
                ))}
              </motion.h1>

              <motion.p
                variants={vipReveal}
                className="mt-6 max-w-xl text-base leading-relaxed text-rave-muted md:text-lg"
              >
                {description}
              </motion.p>

              {children && (
                <motion.div variants={vipReveal} className="mt-7">
                  {children}
                </motion.div>
              )}

              <motion.ul variants={vipStagger} className="mt-7 flex flex-wrap gap-3">
                {meta.map(({ Icon, label }) => (
                  <motion.li
                    key={label}
                    variants={vipReveal}
                    className="inline-flex items-center gap-2 rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-sm text-rave-muted"
                  >
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    {label}
                  </motion.li>
                ))}
              </motion.ul>

              {actions && actions.length > 0 && (
                <motion.div variants={vipReveal} className="mt-7 flex flex-wrap items-center gap-3">
                  {actions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={`group/cta inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base ${
                        (action.tone ?? 'primary') === 'primary'
                          ? 'bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] hover:brightness-110'
                          : 'border border-white/15 bg-white/[0.02] text-white hover:border-rave-red/60 hover:bg-rave-red/10'
                      }`}
                    >
                      {action.icon ?? null}
                      <span>{action.label}</span>
                      <ArrowRight
                        aria-hidden
                        className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                      />
                    </Link>
                  ))}
                </motion.div>
              )}
            </div>

            <motion.div variants={vipReveal} className="lg:col-span-6">
              <motion.div
                ref={visualRef}
                style={reduced ? undefined : { rotateX: rotX, rotateY: rotY, transformPerspective: 1200 }}
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
                className="relative aspect-[16/11] overflow-hidden rounded-[20px] border border-white/[0.08] shadow-[0_30px_80px_rgba(255,23,61,0.18)]"
              >
                <Image
                  src={event.image.src}
                  alt={event.image.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, rgba(3,3,5,0.55) 0%, rgba(3,3,5,0) 45%), linear-gradient(180deg, rgba(3,3,5,0) 45%, rgba(3,3,5,0.6) 100%)',
                  }}
                />

                <div
                  aria-hidden
                  className="absolute right-3 top-4 flex flex-col gap-1.5 rounded-l-xl bg-gradient-to-l from-black/70 to-transparent py-3 pl-6 pr-2 text-right font-heading text-[10px] uppercase tracking-[0.22em] text-white/85 sm:right-5 sm:text-xs"
                  style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                >
                  {sideNotes.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>

                {footNotes && footNotes.length > 0 && (
                  <div
                    aria-hidden
                    className="absolute bottom-4 right-4 flex flex-col gap-1 text-right font-heading text-[10px] uppercase tracking-[0.22em] text-white/75 sm:text-xs"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
                  >
                    {footNotes.map((line) => (
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
