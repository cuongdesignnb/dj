'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarDays, Clock, MapPin, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  TicketEventInfo,
  TicketProviderAction,
  TicketTier,
  TicketTrustItem,
  TicketSelection,
} from '@/lib/tickets/types';
import { buildSelectedLineItems, calculateTicketSubtotal, formatMoney } from '@/lib/tickets/pricing';

const TRUST_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  BadgeCheck,
  Users,
};

export default function TicketSelectionPanel({
  event,
  tiers,
  selection,
  provider,
  trustItems,
}: {
  event: TicketEventInfo;
  tiers: TicketTier[];
  selection: TicketSelection;
  provider: TicketProviderAction;
  trustItems: TicketTrustItem[];
}) {
  const reduced = useReducedMotion();
  const lineItems = buildSelectedLineItems(tiers, selection);
  const subtotal = calculateTicketSubtotal(tiers, selection);
  const hasSelection = lineItems.length > 0;

  // The CTA is only a real link when a provider URL has been configured.
  const providerReady = provider.mode === 'external-link' && !!provider.checkoutUrl;
  const ctaEnabled = providerReady && hasSelection;

  const ctaLabel = providerReady
    ? 'Continue to Ticket Provider'
    : 'Ticket Provider Link Coming Soon';

  const ctaNote = !providerReady
    ? (provider.unavailableNote ?? 'Ticket link will be available soon.')
    : !hasSelection
      ? 'Select at least one ticket to continue.'
      : null;

  return (
    <div className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6">
      <h2
        id="your-selection-title"
        className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[28px]"
      >
        Your Selection
      </h2>
      <p className="mt-1.5 font-heading text-[10px] uppercase tracking-[0.26em] text-rave-muted sm:text-xs">
        Review your tickets
      </p>
      <span
        aria-hidden
        className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
        style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
      />

      {/* Event mini-card */}
      <div className="relative mt-5 overflow-hidden rounded-[16px] border border-white/[0.08]">
        <div className="relative h-28 w-full sm:h-32">
          {event.image.src && (
            <Image
              src={event.image.src}
              alt={event.image.alt}
              fill
              sizes="(max-width: 1024px) 100vw, 320px"
              className="object-cover"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(3,3,5,0.55) 0%, rgba(3,3,5,0.80) 100%)',
            }}
          />
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-heading text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
                {event.title}
              </p>
              {event.subtitle && (
                <p className="mt-1.5 font-heading text-[9px] uppercase tracking-[0.3em] text-white/70 sm:text-[10px]">
                  {event.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        <dl className="flex flex-col gap-2 bg-rave-panel2/70 p-4 text-sm text-rave-muted">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Date</dt>
            <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
            <dd>
              {event.dateStatus === 'confirmed' && event.date ? event.date : 'Date to be announced'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Schedule</dt>
            <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
            <dd>
              {event.scheduleStatus === 'confirmed' && event.schedule
                ? event.schedule
                : 'Schedule to be confirmed'}
            </dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Venue</dt>
            <MapPin aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
            <dd>{event.venue}</dd>
          </div>
        </dl>
      </div>

      {/* Line items */}
      <div className="mt-5 border-t border-white/[0.08] pt-5">
        {hasSelection ? (
          <ul className="flex flex-col gap-3">
            {lineItems.map((item) => (
              <li key={item.tier.id} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-heading text-base uppercase tracking-wide text-white">
                    {item.tier.name}
                  </span>
                  <span className="font-heading text-base text-white">
                    {formatMoney(item.lineTotal)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-sm text-rave-muted">
                  <span>Quantity</span>
                  <span className="tabular-nums">{item.quantity}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-rave-muted">
            No tickets selected yet. Choose a ticket type and quantity to see your total.
          </p>
        )}

        <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-white/[0.08] pt-4">
          <span className="font-heading text-lg font-bold uppercase tracking-wide text-white">
            Subtotal
          </span>
          <motion.span
            key={subtotal.amountMinor}
            initial={reduced ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="font-heading text-3xl font-black tabular-nums text-rave-red"
            style={{ textShadow: '0 0 18px rgba(255,23,61,0.45)' }}
          >
            {formatMoney(subtotal)}
          </motion.span>
        </div>

        {/* Announced quietly so a screen reader hears the new total. */}
        <p aria-live="polite" className="sr-only">
          Subtotal {formatMoney(subtotal)}
        </p>

        <p className="mt-2 text-xs text-rave-muted/80">
          Final pricing confirmed by ticket provider.
        </p>
      </div>

      {/* Provider hand-off */}
      <div className="mt-5">
        {ctaEnabled ? (
          <a
            href={provider.checkoutUrl as string}
            target="_blank"
            rel="noopener noreferrer"
            className="group/cta inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_26px_rgba(255,23,61,0.4)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
          >
            <span>{ctaLabel}</span>
            <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
            <span className="sr-only">(opens the ticket provider in a new tab)</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-[14px] border border-white/[0.12] bg-white/[0.03] px-6 py-4 font-heading text-sm font-semibold uppercase tracking-wider text-rave-muted sm:text-base"
          >
            {ctaLabel}
          </button>
        )}
        {ctaNote && (
          <p className="mt-2 text-center font-heading text-[11px] uppercase tracking-[0.16em] text-rave-muted/80">
            {ctaNote}
          </p>
        )}
      </div>

      {/* Trust items */}
      {trustItems.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4 border-t border-white/[0.08] pt-5">
          {trustItems.map((item) => {
            const Icon = TRUST_ICONS[item.icon] ?? ShieldCheck;
            return (
              <li key={item.id} className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] border border-rave-red/25 bg-rave-red/10 text-rave-red"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-heading text-sm font-bold uppercase tracking-wide text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-rave-muted">
                    {item.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
