'use client';

import { useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import type { Crumb } from '@/components/events/EventsBreadcrumb';
import { eventHeroLineReveal, shopReveal, shopStagger } from '@/lib/animations';

/**
 * Wide banner hero used by /cart: copy on the left, the crowd and ring mark
 * behind it on the right. Markup never depends on the motion preference — only
 * the animation values do — so server and client render identically.
 */
export default function CartHero({
  crumbs,
  eyebrow,
  title,
  description,
  visual,
  sideNotes,
  titleId,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string;
  visual: { src: string; alt: string };
  sideNotes: string[];
  titleId: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '12%']);

  return (
    <>
      <EventsBreadcrumb trail={crumbs} />
      <section
        ref={ref}
        aria-labelledby={titleId}
        className="relative isolate overflow-hidden bg-rave-black"
      >
        <motion.div aria-hidden style={{ y }} className="absolute inset-y-0 right-0 -z-10 w-full md:w-[70%]">
          <Image
            src={visual.src}
            alt={visual.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 70vw"
            className="object-cover opacity-60"
          />
          {/* Ring mark over the stage. */}
          <div className="absolute left-[46%] top-[18%] hidden h-40 w-40 -translate-x-1/2 rounded-full border-[6px] border-rave-red shadow-[0_0_60px_rgba(255,23,61,0.8),inset_0_0_40px_rgba(255,23,61,0.5)] md:grid md:place-items-center">
            <span className="font-heading text-6xl font-bold text-white">C</span>
          </div>
        </motion.div>
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(90deg, #030305 0%, rgba(3,3,5,0.92) 34%, rgba(3,3,5,0.35) 70%, rgba(3,3,5,0.55) 100%), linear-gradient(180deg, rgba(255,23,61,0.10) 0%, rgba(3,3,5,0) 40%, #030305 100%)',
          }}
        />

        <Container>
          <motion.div
            variants={shopStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="relative flex min-h-[260px] items-center py-10 md:min-h-[300px] md:py-14"
          >
            <div className="max-w-xl">
              <motion.p
                variants={shopReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.3em] text-rave-red sm:text-sm"
              >
                {eyebrow}
              </motion.p>
              <h1
                id={titleId}
                className="mt-3 overflow-hidden font-heading text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl"
              >
                <motion.span variants={eventHeroLineReveal} className="block">
                  {title}
                </motion.span>
              </h1>
              <motion.p
                variants={shopReveal}
                className="mt-5 max-w-md text-base leading-relaxed text-white/85 md:text-lg"
              >
                {description}
              </motion.p>
            </div>

            <motion.div
              aria-hidden
              variants={shopReveal}
              className="absolute bottom-8 right-0 hidden flex-col gap-1.5 text-right font-heading text-xs uppercase tracking-[0.3em] text-white/85 sm:flex"
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
