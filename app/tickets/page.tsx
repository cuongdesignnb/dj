import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import TicketsHero from '@/components/tickets/TicketsHero';
import TicketsSelector from '@/components/tickets/TicketsSelector';
import TicketInfoGrid from '@/components/tickets/TicketInfoGrid';
import FaqAccordion from '@/components/shared/FaqAccordion';
import FinalCtaSection from '@/components/shared/FinalCtaSection';

import { DEFAULT_TICKETS_EVENT_SLUG, TICKETS_UNAVAILABLE_MESSAGE, getTicketsRepository } from '@/lib/tickets/repository';
import { eventScopeFromSearchParams } from '@/lib/events/event-scope';
import type { TicketsPageData } from '@/lib/tickets/types';
import TicketsError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

// No Offer/Event structured data: the event date is unconfirmed and payment is
// handled elsewhere, so there is nothing here that can be represented honestly.

type PageSearchParams = { [key: string]: string | string[] | undefined };

/** One load per request for metadata and page; null means the default event. */
const loadTicketsPage = cache(async (eventSlug: string | null): Promise<
  { data: TicketsPageData } | { error: { kind: string; message: string } }
> => {
  const selection = getTicketsRepository(eventSlug);
  if (!selection.ok) {
    return { error: selection.error };
  }

  const result = await selection.repository.getTicketsPage();
  if (!result.ok) {
    return { error: result.error };
  }

  return { data: result.data };
});

/**
 * `?event=<slug>` selects another published event. No parameter (or the
 * default slug) keeps the original page; a malformed or unknown slug is a 404.
 */
async function loadScopedTicketsPage(searchParams: Promise<PageSearchParams>) {
  const scope = eventScopeFromSearchParams(await searchParams);
  if (scope.kind === 'invalid') notFound();
  const eventSlug = scope.kind === 'event' && scope.slug !== DEFAULT_TICKETS_EVENT_SLUG ? scope.slug : null;
  const result = await loadTicketsPage(eventSlug);
  if ('error' in result && result.error.kind === 'not-found') {
    if (eventSlug) notFound();
    // The default event keeps its original message when it is unpublished.
    return { eventSlug, result: { error: { kind: 'network', message: TICKETS_UNAVAILABLE_MESSAGE } } };
  }
  return { eventSlug, result };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<PageSearchParams> }): Promise<Metadata> {
  const { eventSlug, result } = await loadScopedTicketsPage(searchParams);
  if ('error' in result) return buildMetadata({ title: 'Tickets | Connection Rave', description: 'Ticket information from Connection Rave.', path: '/tickets', indexable: false });
  const event = result.data.event;
  // Only the default event's /tickets is indexed; `?event=` variants share that canonical path.
  return buildMetadata({ title: `${event.title} Tickets | Connection Rave`, description: `Review ticket information for ${event.title} and continue to the official provider when a provider is configured.`, path: '/tickets', image: event.image.src ? { url: event.image.src, alt: event.image.alt, width: event.image.width, height: event.image.height } : null, indexable: !eventSlug });
}

/**
 * Server Component. Only the ticket selector is interactive; the hero, info
 * grid, FAQ, CTA and footer are rendered from the same typed page data.
 */
export default async function TicketsPage({ searchParams }: { searchParams: Promise<PageSearchParams> }) {
  const { result } = await loadScopedTicketsPage(searchParams);

  if ('error' in result) {
    return <TicketsError errorMessage={result.error.message} />;
  }

  const data = result.data;

  return (
    <EventsMotion>
      {/* On this page the header CTA scrolls to the options rather than reloading it. */}
      <Header ctaHref={data.finalCta.primary.href} ctaLabel={data.finalCta.primary.label} />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <TicketsHero
          event={data.event}
          content={data.hero}
          visual={data.hero.image?.src ? data.hero.image : data.event.image}
        />
        <TicketsSelector
          event={data.event}
          tiers={data.tiers}
          provider={data.provider}
          trustItems={data.trustItems}
          content={data.selector}
        />
        <TicketInfoGrid items={data.infoItems} />
        <FaqAccordion items={data.faq} titleId="tickets-faq-title" idPrefix="tickets-faq" />
        <FinalCtaSection cta={data.finalCta} titleId="tickets-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
