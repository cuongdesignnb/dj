'use client';

import Image from 'next/image';
import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import Container from '@/components/ui/Container';
import EventActionButton from './EventActionButton';
import { cardStagger, lineReveal } from '@/lib/events/motion';
import {
  resolveTicketsAction,
  resolveVipAction,
} from '@/lib/events/presentation';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

interface Props {
  event: EventPageData;
  routes: FrontendRoutes;
}

export default function EventFinalCta({ event, routes }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setIsInView(true),
      { threshold: 0.05 },
    );
    io.observe(ref.current);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const tickets = resolveTicketsAction(event.event, routes);
  const vip = resolveVipAction(event.event, routes);
  const ambient = !reduced && isInView && tabVisible;
  const bg = event.event.heroBackground;

  return (
    <section
      className="relative isolate overflow-hidden py-16 md:py-24 bg-rave-black"
      aria-labelledby="final-cta-title"
    >
      {/* Crowd background */}
      {bg && (
        <div aria-hidden className="absolute inset-0 -z-10">
          <Image
            src={bg.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            style={{ objectPosition: bg.objectPosition ?? 'center' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rave-black via-rave-black/70 to-rave-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-rave-black via-transparent to-rave-black" />
        </div>
      )}

      {/* Ambient drift */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <motion.div
          className="absolute -top-24 left-1/4 w-[420px] h-[420px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(255,23,61,0.18), transparent 70%)' }}
          animate={ambient ? { opacity: [0.4, 0.7, 0.4], y: [0, 20, 0] } : undefined}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 right-1/4 w-[380px] h-[380px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(139,44,255,0.16), transparent 70%)' }}
          animate={ambient ? { opacity: [0.3, 0.55, 0.3], y: [0, -20, 0] } : undefined}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <Container>
        <motion.div
          ref={ref}
          variants={cardStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="flex flex-col items-center text-center gap-6"
        >
          <motion.span
            variants={lineReveal}
            className="font-heading uppercase tracking-[0.3em] text-xs text-rave-red font-bold"
          >
            Same People · Brighter Tomorrow
          </motion.span>

          <motion.h2
            id="final-cta-title"
            variants={lineReveal}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-[0.95] text-white"
          >
            Ready for Destiny?
          </motion.h2>

          <motion.div
            variants={lineReveal}
            className="flex flex-wrap items-center justify-center gap-3 mt-2"
          >
            <EventActionButton action={tickets} variant="primary" label="Get Tickets" reducedMotion={!!reduced} />
            <EventActionButton action={vip} variant="secondary" label="Explore VIP Tables" reducedMotion={!!reduced} />
          </motion.div>

          {(tickets.note || vip.note) && (
            <motion.p variants={lineReveal} className="text-xs text-rave-muted/80 max-w-md">
              {tickets.note ?? vip.note}
            </motion.p>
          )}
        </motion.div>
      </Container>
    </section>
  );
}
