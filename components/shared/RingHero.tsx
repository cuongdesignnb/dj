'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import type { Crumb } from '@/components/events/EventsBreadcrumb';
import { eventHeroLineReveal, faqReveal, faqStagger, legalReveal } from '@/lib/animations';

/**
 * Split hero with the crowd and Connection ring on the right, used by /faq,
 * /terms and /privacy. Markup never depends on the motion preference — the
 * light sweep is always rendered and hidden by CSS — so server and client
 * output match.
 */
export default function RingHero({
  crumbs,
  eyebrow,
  title,
  description,
  badge,
  visual,
  sideNotes,
  titleId,
  children,
  calm = false,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string;
  /** Small status pill beside or under the title, e.g. "Draft for review". */
  badge?: string | null;
  visual: { src: string; alt: string };
  sideNotes: string[];
  titleId: string;
  children?: ReactNode;
  /** Quieter motion for document pages. */
  calm?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced || calm ? '0%' : '10%']);

  return (
    <>
      <EventsBreadcrumb trail={crumbs} />
      <section
        ref={ref}
        aria-labelledby={titleId}
        className="relative isolate overflow-hidden border-b border-white/[0.06] bg-rave-black"
      >
        <motion.div
          aria-hidden
          style={{ y }}
          initial={{ opacity: 0, scale: calm ? 1 : 1.04 }}
          animate={inView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: calm ? 0.5 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute inset-y-0 right-0 -z-10 w-full md:w-[58%]"
        >
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 58vw"
            className="object-cover opacity-70"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 52% 38%, rgba(255,23,61,0.45), transparent 42%), linear-gradient(180deg, rgba(3,3,5,0) 55%, #030305 100%)',
            }}
          />
          {/* Connection ring over the stage. */}
          <div className="absolute left-1/2 top-[44%] hidden h-44 w-44 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[6px] border-rave-red shadow-[0_0_70px_rgba(255,23,61,0.85),inset_0_0_45px_rgba(255,23,61,0.55)] md:grid lg:h-52 lg:w-52">
            <div className="grid h-[72%] w-[72%] place-items-center rounded-full border-2 border-rave-red/60">
              <span className="font-heading text-6xl font-bold text-white lg:text-7xl">C</span>
            </div>
          </div>
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(90deg, #030305 0%, #030305 44%, rgba(3,3,5,0.6) 58%, rgba(3,3,5,0.1) 78%, rgba(3,3,5,0.35) 100%)',
          }}
        />
        <motion.div
          aria-hidden
          initial={{ x: '-120%' }}
          animate={inView && !reduced && !calm ? { x: '320%' } : { x: '-120%' }}
          transition={{ duration: 1.8, delay: 0.8, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 left-[40%] -z-10 w-1/4 -skew-x-12 motion-reduce:hidden"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)' }}
        />

        <Container>
          <motion.div
            variants={faqStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="relative flex min-h-[300px] items-center py-10 md:min-h-[320px] md:py-12"
          >
            <div className="w-full max-w-xl">
              <motion.p
                variants={faqReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-rave-red sm:text-sm"
              >
                {eyebrow}
              </motion.p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
                <h1
                  id={titleId}
                  className="overflow-hidden font-heading text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:whitespace-nowrap"
                >
                  <motion.span variants={calm ? legalReveal : eventHeroLineReveal} className="block">
                    {title}
                  </motion.span>
                </h1>
                {badge && (
                  <motion.p
                    variants={faqReveal}
                    className="inline-flex items-center gap-2 rounded-full border border-rave-red/70 bg-black/50 px-3.5 py-1.5 text-sm text-white"
                  >
                    <span aria-hidden className="h-2 w-2 rounded-full bg-rave-red" />
                    {badge}
                  </motion.p>
                )}
              </div>
              <motion.p
                variants={faqReveal}
                className="mt-5 max-w-lg text-base leading-relaxed text-white/85 md:text-lg"
              >
                {description}
              </motion.p>
              {children && (
                <motion.div variants={faqReveal} className="mt-7">
                  {children}
                </motion.div>
              )}
            </div>

            <motion.div
              aria-hidden
              variants={faqReveal}
              className="absolute bottom-8 right-0 hidden flex-col gap-1.5 text-right font-heading text-xs uppercase tracking-[0.3em] text-white/85 lg:flex"
              style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
            >
              {sideNotes.map((line) => (
                <span key={line}>{line}</span>
              ))}
              <span className="ml-auto mt-1 block h-[2px] w-8 rounded-full bg-rave-red" />
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
