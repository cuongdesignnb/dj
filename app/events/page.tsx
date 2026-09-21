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
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';
import { publicApiBaseUrl } from '@/lib/api/public';
import { fetchPublicListingContent, listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const params = await searchParams;
  const hasFilter = Object.entries(params).some(([key, value]) => key !== 'locale' && value !== undefined && value !== '');
  const [seo, listing] = await Promise.all([
    getContentSeo('events', { title: 'Upcoming Events | Connection Rave', description: 'Discover published Connection Rave events and experiences.' }),
    fetchPublicListingContent(publicApiBaseUrl(), 'events-list'),
  ]);
  return buildMetadata({
    title: listing?.seo?.title ?? seo.title,
    description: listing?.seo?.description ?? seo.description,
    image: listing?.seo?.ogImage?.src
      ? { url: listing.seo.ogImage.src, alt: listing.seo.ogImage.alt, width: listing.seo.ogImage.width, height: listing.seo.ogImage.height }
      : undefined,
    path: '/events',
    canonicalOverride: seo.canonicalOverride,
    follow: listing?.seo?.follow ?? seo.follow,
    indexable: !hasFilter && (listing?.seo?.index ?? seo.indexable),
  });
}

/**
 * Loads the page through the API-backed repository so the content source stays
 * behind a stable contract rather than leaking into the page component.
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
  const [{ filter: initialFilter }, result] = await Promise.all([
    searchParams.then((params) => ({ filter: parseFilter(params.filter) })),
    loadEventsPage(),
  ]);

  if ('error' in result) {
    return <EventsError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const filter = listingFilter(data.content, 'event-filter', {
    label: 'Filter events',
    options: ['All Events', 'Featured', 'Tickets Available', 'Coming Soon'],
  });
  const featuredSection = listingSection(data.content, 'featured-event', {
    title: 'FEATURED EVENT',
  });
  const eventsSection = listingSection(data.content, 'all-events', {
    title: 'ALL EVENTS',
  });
  const benefitsSection = listingSection(data.content, 'benefits', {
    title: 'WHY ATTEND OUR EVENTS',
    description: 'Music | People | Culture | A Brighter Tomorrow',
  });
  const emptyState = listingEmpty(data.content, {
    title: 'Nothing to show yet.',
    description: 'Check back for the latest updates.',
    cta: { label: 'Back home', href: '/' },
  });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <EventsFilterProvider initialFilter={initialFilter}>
          <EventsHero
            hero={data.hero}
            breadcrumb={data.content?.hero?.breadcrumb}
            filterLabel={filter.label}
            filterOptions={filter.options}
          />
          {featuredSection.enabled !== false && (
            <FeaturedEvent
              event={data.featuredEvent}
              section={featuredSection}
              emptyState={emptyState}
            />
          )}
          {eventsSection.enabled !== false && (
            <EventGrid events={data.events} section={eventsSection} emptyState={emptyState} />
          )}
        </EventsFilterProvider>
        {benefitsSection.enabled !== false && (
          <EventBenefits
            benefits={data.benefits}
            title={benefitsSection.title}
            context={benefitsSection.description
              ?.split('|')
              .map((value) => value.trim())
              .filter(Boolean)}
          />
        )}
        <EventsCTA cta={data.finalCta} />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
