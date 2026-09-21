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
import { getContentSeo } from '@/lib/seo/content';
import { publicApiBaseUrl } from '@/lib/api/public';
import { fetchPublicListingContent, listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

export async function generateMetadata(): Promise<Metadata> {
  const [seo, listing] = await Promise.all([
    getContentSeo('past-events', { title: 'Past Events | Connection Rave', description: 'Explore published Connection Rave event archive records.' }),
    fetchPublicListingContent(publicApiBaseUrl(), 'past-events'),
  ]);
  return buildMetadata({
    title: listing?.seo?.title ?? seo.title,
    description: listing?.seo?.description ?? seo.description,
    image: listing?.seo?.ogImage?.src
      ? { url: listing.seo.ogImage.src, alt: listing.seo.ogImage.alt, width: listing.seo.ogImage.width, height: listing.seo.ogImage.height }
      : undefined,
    path: '/events/past',
    canonicalOverride: seo.canonicalOverride,
    follow: listing?.seo?.follow ?? seo.follow,
    indexable: false,
  });
}

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
  const [{ filter: initialFilter }, result] = await Promise.all([
    searchParams.then((params) => ({ filter: parsePastFilter(params.filter) })),
    loadPastEventsPage(),
  ]);

  if ('error' in result) {
    return <PastEventsError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const filter = listingFilter(data.content, 'archive-filter', {
    label: 'Filter archive',
    options: ['All Recaps', 'Featured', 'Photo Gallery', 'Highlights'],
  });
  const featuredSection = listingSection(data.content, 'featured-recap', {
    title: 'FEATURED RECAP',
  });
  const archiveSection = listingSection(data.content, 'archive', {
    title: 'EVENT ARCHIVE',
  });
  const benefitsSection = listingSection(data.content, 'benefits', {
    title: 'Past event benefits',
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
          <PastEventsHero
            hero={data.hero}
            breadcrumb={data.content?.hero?.breadcrumb}
            filterLabel={filter.label}
            filterOptions={filter.options}
          />
          {featuredSection.enabled !== false && (
            <FeaturedRecap
              recap={data.featuredRecap}
              section={featuredSection}
              emptyState={emptyState}
            />
          )}
          {archiveSection.enabled !== false && (
            <PastEventGrid events={data.events} section={archiveSection} emptyState={emptyState} />
          )}
        </EventsFilterProvider>
        {benefitsSection.enabled !== false && (
          <EventBenefits
            benefits={data.benefits}
            title={benefitsSection.title}
            titleId="archive-benefits-title"
            context={benefitsSection.description
              ?.split('|')
              .map((value) => value.trim())
              .filter(Boolean)}
          />
        )}
        <EventsCTA cta={data.finalCta} titleId="past-events-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
