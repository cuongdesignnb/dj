'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import { featureIcon } from './feature-icons';
import { cardStagger, cardItem } from '@/lib/events/motion';
import type { EventPageData } from '@/lib/events/types';

/** Age, ID, entry and dress-code notes from Admin › Event Page Content › Good to Know. */
export default function EventGoodToKnow({ event }: { event: EventPageData }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const items = event.event.goodToKnow ?? [];
  if (items.length === 0) return null;

  return (
    <section id="good-to-know" aria-labelledby="good-to-know-title" className="relative py-16 md:py-24 bg-rave-black">
      <Container>
        <EventSectionHeading eyebrow="Before you go" title="Good to Know" id="good-to-know-title" align="left" />
        <motion.div
          ref={ref}
          variants={cardStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {items.map((item) => {
            const Icon = featureIcon(item.icon);
            return (
              <motion.article key={item.id} variants={cardItem} className="flex gap-4 rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-5">
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rave-red/30 bg-rave-red/10 text-rave-red">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-white">{item.title}</h3>
                  {item.description && <p className="mt-1.5 text-sm leading-relaxed text-rave-muted">{item.description}</p>}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}
