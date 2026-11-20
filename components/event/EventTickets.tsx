'use client';

import { ArrowRight, ExternalLink, Ticket } from 'lucide-react';
import Container from '@/components/ui/Container';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import EventSectionHeading from './EventSectionHeading';
import { formatMoney } from '@/lib/tickets/pricing';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

const SALE_LABELS: Record<string, string> = { ON_SALE: 'On sale now', COMING_SOON: 'Release announced soon', SOLD_OUT: 'Sold out', CLOSED: 'Sales closed' };

/** Ticket tiers for this event, with the on-site checkout and/or the external seller. */
export default function EventTickets({ event, routes }: { event: EventPageData; routes: FrontendRoutes }) {
  const e = event.event;
  const tiers = e.tickets ?? [];
  const settings = e.ticketSettings;
  const provider = settings?.providerUrl ? { name: settings.providerName || 'the ticket provider', url: settings.providerUrl } : null;
  const ticketsHref = routes.tickets ?? '/tickets';
  const button = 'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-7 font-heading text-sm font-bold uppercase tracking-[0.14em] transition';

  return (
    <section id="tickets" aria-labelledby="event-tickets-title" className="scroll-mt-32 bg-rave-black py-16 md:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <EventSectionHeading eyebrow="Tickets" title="Get Your Tickets" id="event-tickets-title" align="left" />
          {!e.isPast && settings && SALE_LABELS[settings.saleStatus] && (
            <span className="rounded-full border border-rave-red/40 bg-rave-red/10 px-4 py-1.5 font-heading text-xs uppercase tracking-[0.18em] text-white">{SALE_LABELS[settings.saleStatus]}</span>
          )}
        </div>

        {e.isPast ? (
          <p data-event-tickets-state="past" className="mt-8 rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-6 text-rave-muted">
            This event has ended. Thanks to everyone who came — see the upcoming events for the next night.
          </p>
        ) : (
          <>
            {tiers.length > 0 && (
              <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tiers.map((tier) => {
                  const soldOut = String(tier.availabilityStatus).toUpperCase() === 'SOLD_OUT';
                  return (
                    <li key={tier.id} className={`relative rounded-2xl border bg-rave-panel/60 p-6 ${soldOut ? 'border-white/[0.06] opacity-60' : 'border-white/[0.10]'}`}>
                      {tier.badge && <span className="absolute right-4 top-4 rounded-full bg-rave-red px-3 py-1 font-heading text-[10px] uppercase tracking-[0.16em] text-white">{tier.badge}</span>}
                      <Ticket aria-hidden className="h-6 w-6 text-rave-red" />
                      <h3 className="mt-3 font-heading text-lg font-bold uppercase tracking-wide text-white">{tier.name}</h3>
                      <p className="mt-1 font-heading text-3xl font-black text-white">{formatMoney({ amountMinor: tier.priceMinor, currency: tier.currency })}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.14em] text-rave-muted">
                        {soldOut ? 'Sold out' : [tier.purchasableOnline && 'Online', tier.purchasableAtDoor && 'At the door'].filter(Boolean).join(' · ') || 'Details on the tickets page'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            {tiers.length === 0 && !provider && (
              <p data-event-tickets-state="pending" className="mt-8 rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-6 text-rave-muted">
                Ticket release details will be published here. Join the newsletter on the homepage to hear first.
              </p>
            )}

            {(tiers.length > 0 || provider) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {tiers.length > 0 && (
                  <NavigationLink href={ticketsHref} className={`${button} bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_24px_rgb(var(--rave-accent-rgb)/0.4)] hover:brightness-110`}>
                    Choose tickets <ArrowRight aria-hidden className="h-4 w-4" />
                  </NavigationLink>
                )}
                {provider && (
                  <a href={provider.url} target="_blank" rel="noopener noreferrer" data-event-tickets-provider="" className={`${button} ${tiers.length > 0 ? 'border border-white/[0.16] text-white hover:border-rave-red hover:bg-rave-red/10' : 'bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_24px_rgb(var(--rave-accent-rgb)/0.4)] hover:brightness-110'}`}>
                    Buy tickets on {provider.name} <ExternalLink aria-hidden className="h-4 w-4" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
