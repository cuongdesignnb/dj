'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Music, Sparkles, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import { eventsReveal, eventsStagger } from '@/lib/animations';
import type { EventBenefit } from '@/lib/events/listing-types';
import EventsSectionHeading from './EventsSectionHeading';

const ICONS: Record<string, LucideIcon> = {
  Music,
  Sparkles,
  Users,
  Ticket,
};

export default function EventBenefits({ benefits }: { benefits: EventBenefit[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (benefits.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="event-benefits-title"
      className="relative bg-rave-deep py-16 md:py-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-rave-grid opacity-[0.07]" />

      <Container className="relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <EventsSectionHeading title="WHY ATTEND OUR EVENTS" titleId="event-benefits-title" />
          <p className="font-heading text-[11px] uppercase tracking-[0.28em] text-rave-muted sm:text-xs md:pb-2">
            Music <span aria-hidden className="text-rave-red">&times;</span> People{' '}
            <span aria-hidden className="text-rave-red">&times;</span> Culture{' '}
            <span aria-hidden className="text-rave-red">&times;</span> A Brighter Tomorrow
          </p>
        </div>

        <motion.ul
          variants={eventsStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {benefits.map((benefit) => {
            const Icon = ICONS[benefit.icon] ?? Sparkles;
            return (
              <motion.li
                key={benefit.id}
                variants={eventsReveal}
                className="group rounded-[18px] border border-white/[0.08] bg-rave-panel/70 p-6 transition-colors duration-300 hover:border-rave-red/45"
              >
                <motion.span
                  className="mb-4 inline-grid h-11 w-11 place-items-center rounded-[14px] border border-rave-red/30 bg-rave-red/10 text-rave-red"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </motion.span>
                <h3 className="font-heading text-lg font-bold uppercase tracking-[0.08em] text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-rave-muted">{benefit.description}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
