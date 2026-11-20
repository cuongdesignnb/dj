'use client';

import { ArrowRight, Crown, Users, Wine } from 'lucide-react';
import Container from '@/components/ui/Container';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import EventSectionHeading from './EventSectionHeading';
import { formatMoney } from '@/lib/tickets/pricing';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** VIP booth packages for this event, with the club map and booking request. */
export default function EventVipTables({ event, routes }: { event: EventPageData; routes: FrontendRoutes }) {
  const e = event.event;
  const packages = e.vipEnabled ? e.vip.packages : [];
  const booths = e.vipEnabled ? e.vip.booths.length : 0;
  const canBook = e.vipEnabled && e.vipBookingEnabled !== false && !e.isPast;
  const button = 'inline-flex min-h-[50px] items-center justify-center gap-2 rounded-full px-7 font-heading text-sm font-bold uppercase tracking-[0.14em] transition';

  return (
    <section id="vip-tables" aria-labelledby="event-vip-title" className="scroll-mt-32 bg-rave-deep py-16 md:py-24">
      <Container>
        <EventSectionHeading eyebrow="VIP Tables" title="Book A Table" id="event-vip-title" align="left" />

        {packages.length > 0 ? (
          <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => {
              const price = num(pkg.priceMinor);
              const capacity = num(pkg.capacity);
              const bottles = num(pkg.includedBottleCount);
              return (
                <li key={String(pkg.id ?? index)} className="rounded-2xl border border-rave-red/30 bg-rave-panel/70 p-6">
                  <Crown aria-hidden className="h-6 w-6 text-rave-red" />
                  <h3 className="mt-3 font-heading text-lg font-bold uppercase tracking-wide text-white">{String(pkg.name ?? 'VIP package')}</h3>
                  {price !== null && <p className="mt-1 font-heading text-3xl font-black text-white">{formatMoney({ amountMinor: price, currency: String(pkg.currency ?? 'AUD') })}</p>}
                  <ul className="mt-4 flex flex-col gap-2 text-sm text-white/85">
                    {capacity !== null && <li className="flex items-center gap-2"><Users aria-hidden className="h-4 w-4 text-rave-red" />Up to {capacity} guests</li>}
                    {bottles !== null && bottles > 0 && <li className="flex items-center gap-2"><Wine aria-hidden className="h-4 w-4 text-rave-red" />{bottles} bottle{bottles === 1 ? '' : 's'} included</li>}
                  </ul>
                </li>
              );
            })}
          </ul>
        ) : (
          <p data-event-vip-state="request" className="mt-8 max-w-2xl rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-6 text-rave-muted">
            {e.isPast ? 'This event has ended.' : 'VIP booths and bottle service are arranged on request. Tell us your group size and the team will get back to you.'}
          </p>
        )}

        {!e.isPast && (
          <div className="mt-8 flex flex-wrap gap-3">
            {canBook ? (
              <NavigationLink href={routes.booking ?? '/book-now'} className={`${button} bg-gradient-to-r from-rave-red to-rave-red2 text-white shadow-[0_0_24px_rgb(var(--rave-accent-rgb)/0.4)] hover:brightness-110`}>
                Request a table <ArrowRight aria-hidden className="h-4 w-4" />
              </NavigationLink>
            ) : (
              <NavigationLink href="/contact" className={`${button} bg-gradient-to-r from-rave-red to-rave-red2 text-white hover:brightness-110`}>
                Ask about VIP <ArrowRight aria-hidden className="h-4 w-4" />
              </NavigationLink>
            )}
            {e.vipEnabled && (
              <NavigationLink href={routes.tables ?? '/tables'} className={`${button} border border-white/[0.16] text-white hover:border-rave-red hover:bg-rave-red/10`}>
                View club map{booths > 0 ? ` · ${booths} booths` : ''}
              </NavigationLink>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
