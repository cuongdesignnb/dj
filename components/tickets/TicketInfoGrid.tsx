'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CircleHelp, DoorOpen, ShoppingCart, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import { ticketReveal, ticketStagger } from '@/lib/animations';
import type { TicketInfoItem } from '@/lib/tickets/types';

const ICONS: Record<string, LucideIcon> = {
  ShoppingCart,
  DoorOpen,
  Ticket,
  CircleHelp,
};

export default function TicketInfoGrid({ items }: { items: TicketInfoItem[] }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (items.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="good-to-know-title"
      className="relative bg-rave-deep py-16 md:py-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-rave-grid opacity-[0.07]" />

      <Container className="relative z-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id="good-to-know-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              Good To Know
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <p className="font-heading text-[11px] uppercase tracking-[0.28em] text-rave-muted sm:text-xs md:pb-2">
            Music Connects Us All
          </p>
        </div>

        <motion.ul
          variants={ticketStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? Ticket;
            return (
              <motion.li
                key={item.id}
                variants={ticketReveal}
                className="rounded-[18px] border border-white/[0.08] bg-rave-panel/70 p-6 transition-colors duration-300 hover:border-rave-red/45"
              >
                <motion.span
                  className="mb-4 inline-grid h-11 w-11 place-items-center rounded-[14px] border border-rave-red/30 bg-rave-red/10 text-rave-red"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </motion.span>
                <h3 className="font-heading text-lg font-bold uppercase tracking-[0.06em] text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-rave-muted">{item.description}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
