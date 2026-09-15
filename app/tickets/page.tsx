import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import TicketsHero from '@/components/tickets/TicketsHero';
import TicketsSelector from '@/components/tickets/TicketsSelector';
import TicketInfoGrid from '@/components/tickets/TicketInfoGrid';
import TicketFaq from '@/components/tickets/TicketFaq';
import TicketsCTA from '@/components/tickets/TicketsCTA';

import { getTicketsRepository } from '@/lib/tickets/repository';
import type { TicketsPageData } from '@/lib/tickets/types';
import TicketsError from './error';

export const metadata: Metadata = {
  title: 'Tickets | DESTINY — Connection Rave',
  description:
    'Choose your ticket for the DESTINY experience at Metro City, Perth and continue securely to the official ticket provider.',
};

// No Offer/Event structured data: the event date is unconfirmed and payment is
// handled elsewhere, so there is nothing here that can be represented honestly.

async function loadTicketsPage(): Promise<
  { data: TicketsPageData } | { error: { message: string } }
> {
  const selection = getTicketsRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getTicketsPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/**
 * Server Component. Only the ticket selector is interactive; the hero, info
 * grid, FAQ, CTA and footer are rendered from the same typed page data.
 */
export default async function TicketsPage() {
  const result = await loadTicketsPage();

  if ('error' in result) {
    return <TicketsError errorMessage={result.error.message} />;
  }

  const data = result.data;

  return (
    <EventsMotion>
      {/* On this page the header CTA scrolls to the options rather than reloading it. */}
      <Header ctaHref="#ticket-options" ctaLabel="Get Tickets" />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <TicketsHero
          event={data.event}
          visual={{
            src: '/assets/hero-crowd.jpg',
            alt: 'Crowd with raised hands in front of a circular stage light under red lasers',
          }}
        />
        <TicketsSelector
          event={data.event}
          tiers={data.tiers}
          provider={data.provider}
          trustItems={data.trustItems}
        />
        <TicketInfoGrid items={data.infoItems} />
        <TicketFaq items={data.faq} />
        <TicketsCTA cta={data.finalCta} />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
