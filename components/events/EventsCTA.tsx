'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Container from '@/components/ui/Container';
import { eventsReveal, eventsStagger } from '@/lib/animations';
import type { EventsFinalCta } from '@/lib/events/listing-types';
import EventAction from './EventAction';

export default function EventsCTA({ cta }: { cta: EventsFinalCta }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  // Gentle background drift only — no strobing, no flashing.
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section
      ref={ref}
      aria-labelledby="events-cta-title"
      className="relative isolate overflow-hidden bg-rave-black py-20 md:py-28"
    >
      {cta.background?.src && (
        <motion.div
          aria-hidden
          style={reduced ? undefined : { y: backgroundY }}
          className="absolute inset-0 -z-10 scale-110"
        >
          <Image
            src={cta.background.src}
            alt=""
            fill
            aria-hidden
            loading="lazy"
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(3,3,5,0.94) 0%, rgba(3,3,5,0.86) 45%, rgba(3,3,5,0.80) 100%)',
            }}
          />
        </motion.div>
      )}

      <Container>
        <motion.div
          variants={eventsStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12"
        >
          <div>
            {cta.eyebrow && (
              <motion.p
                variants={eventsReveal}
                className="font-heading text-[11px] uppercase tracking-[0.3em] text-rave-red sm:text-xs"
              >
                {cta.eyebrow}
              </motion.p>
            )}

            <motion.h2
              id="events-cta-title"
              variants={eventsReveal}
              className="mt-4 font-heading text-3xl font-black uppercase leading-[1.03] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[52px]"
            >
              {cta.title}
            </motion.h2>

            {cta.description && (
              <motion.p
                variants={eventsReveal}
                className="mt-5 max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base"
              >
                {cta.description}
              </motion.p>
            )}
          </div>

          <motion.div
            variants={eventsReveal}
            className="flex flex-wrap items-start gap-3 lg:justify-end"
          >
            <EventAction action={cta.primary} />
            {cta.secondary && <EventAction action={cta.secondary} tone="secondary" />}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
