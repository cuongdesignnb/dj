'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
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

  if (tiers.length === 0) {
    return (
      <section ref={ref} aria-labelledby="ticket-options-title" className="bg-rave-black py-16 md:py-24">
        <Container>
          <h2
            id="ticket-options-title"
            className="font-heading text-3xl font-black uppercase tracking-tight text-white sm:text-4xl"
          >
              {content.emptyTitle}
          </h2>
          <div className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center">
            <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              Ticket information is being prepared.
            </p>
            <p className="mt-3 text-sm text-rave-muted sm:text-base">
              {content.emptyDescription}
            </p>
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
                  style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
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
