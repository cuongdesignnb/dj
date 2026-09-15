'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Check, DoorOpen, GraduationCap, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TicketTier } from '@/lib/tickets/types';
import { formatMoney } from '@/lib/tickets/pricing';
import { ticketReveal } from '@/lib/animations';
import TicketQuantityControl from './TicketQuantityControl';

const ICONS: Record<string, LucideIcon> = {
  GraduationCap,
  Ticket,
  DoorOpen,
};

export default function TicketOptionCard({
  tier,
  quantity,
  onQuantityChange,
}: {
  tier: TicketTier;
  quantity: number;
  onQuantityChange(value: number): void;
}) {
  const reduced = useReducedMotion();
  const Icon = ICONS[tier.icon] ?? Ticket;
  const selected = tier.purchasableOnline && quantity > 0;

  return (
    <motion.li
      variants={ticketReveal}
      whileHover={reduced ? undefined : { y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`relative rounded-[18px] border bg-rave-panel/80 p-5 transition-[border-color,box-shadow] duration-300 sm:p-6 ${
        selected
          ? 'border-rave-red shadow-[0_0_34px_rgba(255,23,61,0.28)]'
          : 'border-white/[0.08] hover:border-rave-red/40 hover:shadow-[0_18px_50px_rgba(255,23,61,0.16)]'
      }`}
    >
      {selected && (
        <motion.span
          aria-hidden
          initial={reduced ? false : { scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18 }}
          className="absolute -right-2.5 -top-2.5 grid h-8 w-8 place-items-center rounded-full bg-rave-red text-white shadow-[0_0_18px_rgba(255,23,61,0.6)]"
        >
          <Check className="h-4 w-4" />
        </motion.span>
      )}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <span
          aria-hidden
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] border transition-colors duration-300 ${
            selected
              ? 'border-rave-red/60 bg-rave-red/15 text-rave-red'
              : 'border-white/[0.10] bg-white/[0.03] text-rave-red/80'
          }`}
        >
          <Icon className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-heading text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
              {tier.name}
            </h3>
            {tier.badge && (
              <span className="inline-flex items-center rounded-lg border border-rave-red/60 bg-rave-red/10 px-2.5 py-1 font-heading text-[10px] font-semibold uppercase tracking-[0.18em] text-rave-red sm:text-[11px]">
                {tier.badge}
              </span>
            )}
          </div>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-rave-muted">
            {tier.description}
          </p>

          {tier.features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-rave-muted">
                  <Check aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                  {feature}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <p className="flex flex-col sm:items-end">
            <span className="font-heading text-4xl font-black leading-none text-white sm:text-[42px]">
              {formatMoney(tier.price)}
            </span>
            <span className="mt-1 font-heading text-[10px] uppercase tracking-[0.22em] text-rave-muted">
              Per Ticket
            </span>
          </p>

          {tier.purchasableOnline ? (
            <TicketQuantityControl
              value={quantity}
              min={tier.minQuantity}
              max={tier.maxQuantity}
              label={tier.name}
              onChange={onQuantityChange}
            />
          ) : (
            // Door tickets are information, not something this page can sell.
            <span className="inline-flex items-center rounded-[14px] border border-white/[0.12] bg-white/[0.03] px-5 py-3 font-heading text-sm uppercase tracking-wider text-rave-muted">
              {tier.purchasableAtDoor ? 'Pay at the Door' : 'Not available online'}
            </span>
          )}
        </div>
      </div>
    </motion.li>
  );
}
