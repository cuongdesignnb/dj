import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFilterProvider from '@/components/events/EventsFilterProvider';
import EventBenefits from '@/components/events/EventBenefits';
import EventsCTA from '@/components/events/EventsCTA';
import EventsFooter from '@/components/events/EventsFooter';
import PastEventsHero from '@/components/events/past/PastEventsHero';
import FeaturedRecap from '@/components/events/past/FeaturedRecap';
import PastEventGrid from '@/components/events/past/PastEventGrid';

import { getEventsRepository } from '@/lib/events/listing-repository';
import type { PastEventsPageData } from '@/lib/events/listing-types';
import { parsePastFilter } from '@/lib/events/listing-types';
import PastEventsError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildMetadata({ title: 'Past Events | Connection Rave', description: 'Explore published Connection Rave event archive records.', path: '/events/past', indexable: false });

// No Event JSON-LD here: the archive currently holds placeholders, and
// structured data would publish them as records of real nights.

async function loadPastEventsPage(): Promise<
  { data: PastEventsPageData } | { error: { message: string } }
> {
  const selection = getEventsRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getPastEventsPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/**
 * Server Component. Filters, motion and the interactive cards are client
 * islands; the page itself stays on the server and loads through the shared
 * events repository.
 */
export default async function PastEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ filter }, result] = await Promise.all([
    searchParams.then((params) => ({ filter: parsePastFilter(params.filter) })),
    loadPastEventsPage(),
  ]);

  if ('error' in result) {
    return <PastEventsError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const benefitsSection = data.content?.sections?.find((section) => section.key === 'benefits' && section.enabled !== false);

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <EventsFilterProvider initialFilter={filter}>
          <PastEventsHero hero={data.hero} />
          <FeaturedRecap recap={data.featuredRecap} />
          <PastEventGrid events={data.events} />
        </EventsFilterProvider>
        <EventBenefits
          benefits={data.benefits}
          title={benefitsSection?.title ?? ''}
          titleId="archive-benefits-title"
          context={benefitsSection?.description ? benefitsSection.description.split('|').map((value) => value.trim()).filter(Boolean) : []}
        />
        <EventsCTA cta={data.finalCta} titleId="past-events-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
