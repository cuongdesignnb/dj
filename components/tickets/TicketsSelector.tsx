'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check, ExternalLink, ShieldCheck } from 'lucide-react';
import Container from '@/components/ui/Container';
import { ticketStagger } from '@/lib/animations';
import type {
  TicketEventInfo,
  TicketProviderAction,
  TicketSelection,
  TicketTier,
  TicketTrustItem,
  TicketSelectorContent,
} from '@/lib/tickets/types';
import { clampQuantity, initialSelection } from '@/lib/tickets/pricing';
import TicketOptionCard from './TicketOptionCard';
import TicketSelectionPanel from './TicketSelectionPanel';
import RichText from '@/components/shared/RichText';
import AdminFixLink from '@/components/shared/AdminFixLink';

/**
 * The interactive half of /tickets.
 *
 * Selection state lives here rather than in the page so the rest of the route
 * stays a Server Component. The starting quantities come from the tier data,
 * not from a hardcoded default in the UI.
 */
export default function TicketsSelector({
  event,
  tiers,
  provider,
  trustItems,
  content,
}: {
  event: TicketEventInfo;
  tiers: TicketTier[];
  provider: TicketProviderAction;
  trustItems: TicketTrustItem[];
  content: TicketSelectorContent;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const [selection, setSelection] = useState<TicketSelection>(() => initialSelection(tiers));

  const tiersById = useMemo(
    () => new Map(tiers.map((tier) => [tier.id, tier])),
    [tiers],
  );

  const setQuantity = useCallback(
    (tierId: string, requested: number) => {
      const tier = tiersById.get(tierId);
      if (!tier || !tier.purchasableOnline) return;
      const next = clampQuantity(tier, requested);
      setSelection((current) =>
        current[tierId] === next ? current : { ...current, [tierId]: next },
      );
    },
    [tiersById],
  );

  // Sold only through an external provider (e.g. TicketsCandy): send people straight there.
  if (tiers.length === 0 && provider.mode === 'external-link' && provider.checkoutUrl) {
    const name = provider.providerName || 'the ticket provider';
    const steps = [
      { title: `Open ${name}`, text: `Tap Buy tickets — ${name} opens in a new tab on the official ${event.title} page.` },
      { title: 'Choose and pay', text: `Pick your ticket type and quantity, then complete checkout securely on ${name}.` },
      { title: 'Keep your confirmation', text: `${name} confirms your order. Keep that confirmation handy for the night.` },
    ];
    const day = event.dateStatus === 'confirmed' ? event.date : null;
    const hours = event.scheduleStatus === 'confirmed' ? event.schedule : null;
    return (
      <section ref={ref} id="ticket-options" data-testid="ticket-provider-only" aria-labelledby="ticket-options-title" className="bg-rave-black py-16 md:py-24">
        <Container>
          <p className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-rave-red sm:text-sm">Tickets on sale</p>
          <h2 id="ticket-options-title" className="mt-3 font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            How to get your tickets
          </h2>
          <p className="mt-3 max-w-2xl text-rave-muted">
            {event.title} tickets are sold through {name}, our official ticketing partner for this event.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <ol className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-3 lg:order-1 lg:col-span-7 lg:grid-cols-1">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4 rounded-[18px] border border-white/[0.08] bg-rave-panel/50 p-5">
                  <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rave-red/40 bg-rave-red/10 font-heading text-base font-bold text-rave-red">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold uppercase tracking-wide text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-rave-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="relative overflow-hidden rounded-[22px] border border-rave-red/40 bg-rave-panel/70 p-6 shadow-[0_0_40px_rgb(var(--rave-accent-rgb)/0.12)] sm:p-8 order-1 lg:order-2 lg:col-span-5">
              <div className="flex items-start gap-4">
                {event.image.src && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.image.src} alt="" className="h-24 w-[77px] shrink-0 rounded-xl border border-white/[0.10] object-cover" />
                )}
                <div className="min-w-0">
                  <p className="font-heading text-[11px] uppercase tracking-[0.22em] text-rave-muted/80">Your event</p>
                  <p className="mt-1 font-heading text-xl font-bold uppercase tracking-wide text-white">{event.title}</p>
                  {day && <p className="mt-1 text-sm text-white/85">{day}</p>}
                  {hours && <p className="text-sm text-white/85">{hours}</p>}
                  {event.venue && <p className="mt-0.5 text-sm text-rave-muted">{event.venue}</p>}
                </div>
              </div>
              <a
                href={provider.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-8 font-heading text-sm font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_24px_rgb(var(--rave-accent-rgb)/0.4)] transition hover:brightness-110"
              >
                Buy tickets on {name}
                <ExternalLink aria-hidden className="h-4 w-4" />
                <span className="sr-only">(opens {name} in a new tab)</span>
              </a>
              <p className="mt-4 flex items-center justify-center gap-2 text-xs text-rave-muted">
                <ShieldCheck aria-hidden className="h-4 w-4 text-rave-red" /> Secure checkout handled by {name}
              </p>
              {trustItems.length > 0 && (
                <ul className="mt-6 space-y-2 border-t border-white/[0.08] pt-5 text-sm text-rave-muted">
                  {trustItems.map((item) => (
                    <li key={item.id} className="flex gap-2"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-rave-red" /><span><span className="text-white">{item.title}</span>{item.description ? ` — ${item.description}` : ''}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (tiers.length === 0) {
    return (
      <section ref={ref} id="ticket-options" data-testid="ticket-empty-state" aria-labelledby="ticket-options-title" className="bg-rave-black py-16 md:py-24">
        <Container>
          <h2
            id="ticket-options-title"
            className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
          >
              {content.emptyTitle || 'Ticket release details are coming soon.'}
          </h2>
          <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center">
            <div className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              <RichText text={content.emptyDescription || 'Ticket release details will appear here when confirmed by the organiser.'} />
            </div>
            <AdminFixLink href={`/admin/events/${event.id}/tickets/tiers`} label="Add ticket tiers in Admin" />
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section
      ref={ref}
      id="ticket-options"
      aria-labelledby="ticket-options-title"
      className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
    >
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* Options */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="ticket-options-title"
                  className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl"
                >
                  {content.title}
                </h2>
                <span
                  aria-hidden
                  className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
                  style={{ boxShadow: '0 0 18px rgb(var(--rave-accent-rgb)/0.55)' }}
                />
              </div>
              <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:text-xs sm:pb-2">
                {content.aside}
              </p>
            </div>

            <motion.ul
              variants={ticketStagger}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              className="mt-8 flex flex-col gap-5"
            >
              {tiers.map((tier) => (
                <TicketOptionCard
                  key={tier.id}
                  tier={tier}
                  quantity={selection[tier.id] ?? tier.minQuantity}
                  onQuantityChange={(value) => setQuantity(tier.id, value)}
                />
              ))}
            </motion.ul>
          </div>

          {/* Summary — sticky on desktop only, and never taller than the viewport. */}
          <aside
            aria-labelledby="your-selection-title"
            className="lg:sticky lg:top-[104px] lg:max-h-[calc(100vh-124px)] lg:overflow-y-auto"
          >
            <TicketSelectionPanel
              event={event}
              tiers={tiers}
              selection={selection}
              provider={provider}
              trustItems={trustItems}
            />
          </aside>
        </div>
      </Container>
    </section>
  );
}
