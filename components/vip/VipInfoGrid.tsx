'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, Clock, Crown, Headset, Map, Ticket, Users, Wine } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Container from '@/components/ui/Container';
import { vipReveal, vipStagger } from '@/lib/animations';

const ICONS: Record<string, LucideIcon> = {
  Crown,
  Users,
  Wine,
  Map,
  Clock,
  Ticket,
  Headset,
};

export interface VipInfoCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string } | null;
}

/**
 * Card grid used for both "VIP Information" on /tables and "Booking Notes" on
 * /book-now — same shape, different copy and heading.
 */
export default function VipInfoGrid({
  items,
  title,
  titleId,
  context,
}: {
  items: VipInfoCard[];
  title: string;
  titleId: string;
  context?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (items.length === 0) return null;

  return (
    <section ref={ref} aria-labelledby={titleId} className="relative bg-rave-black py-16 md:py-24">
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2
              id={titleId}
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              {title}
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          {context && (
            <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:text-xs md:pb-2">
              {context}
            </p>
          )}
        </div>

        <motion.ul
          variants={vipStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon] ?? Crown;
            return (
              <motion.li
                key={item.id}
                variants={vipReveal}
                className="flex flex-col rounded-[18px] border border-white/[0.08] bg-rave-panel/70 p-6 transition-colors duration-300 hover:border-rave-red/45"
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

                {item.action && (
                  <Link
                    href={item.action.href}
                    className="group/link mt-4 inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.02] px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                  >
                    {item.action.label}
                    <ArrowRight
                      aria-hidden
                      className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1"
                    />
                  </Link>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      </Container>
    </section>
  );
}
