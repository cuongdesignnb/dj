import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFilterProvider from '@/components/events/EventsFilterProvider';
import EventsHero from '@/components/events/EventsHero';
import FeaturedEvent from '@/components/events/FeaturedEvent';
import EventGrid from '@/components/events/EventGrid';
import EventBenefits from '@/components/events/EventBenefits';
import EventsCTA from '@/components/events/EventsCTA';
import EventsFooter from '@/components/events/EventsFooter';

import { getEventsRepository } from '@/lib/events/listing-repository';
import type { EventsPageData } from '@/lib/events/listing-types';
import { parseFilter } from '@/lib/events/listing-types';
import EventsError from './error';

export const metadata: Metadata = {
  title: 'Upcoming Events | Connection Rave',
  description:
    'Discover upcoming Connection Rave events in Perth, featuring immersive production, curated lineups and unforgettable nightlife experiences.',
};

/**
 * Loads the page through the repository so the content source (mock today,
 * HTTP later) is a configuration detail rather than a code change here.
 */
async function loadEventsPage(): Promise<
  { data: EventsPageData } | { error: { message: string } }
> {
  const selection = getEventsRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getEventsPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/**
 * Server Component. Only the pieces that need interaction or motion are
 * client islands — the page itself stays on the server.
 */
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ filter }, result] = await Promise.all([
    searchParams.then((params) => ({ filter: parseFilter(params.filter) })),
    loadEventsPage(),
  ]);

  if ('error' in result) {
    return <EventsError errorMessage={result.error.message} />;
  }

  const data = result.data;

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <EventsFilterProvider initialFilter={filter}>
          <EventsHero hero={data.hero} />
          <FeaturedEvent event={data.featuredEvent} />
          <EventGrid events={data.events} />
        </EventsFilterProvider>
        <EventBenefits benefits={data.benefits} />
        <EventsCTA cta={data.finalCta} />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
