import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import PageHero from '@/components/shared/PageHero';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import ArtistGrid from '@/components/artists/ArtistGrid';
import LineupStoryBanner from '@/components/artists/LineupStoryBanner';

import { getArtistRepository } from '@/lib/artists/repository';
import { parseCountryFilter } from '@/lib/artists/helpers';
import type { LineupPageData } from '@/lib/artists/types';
import LineupError from './error';
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';
import { publicApiBaseUrl } from '@/lib/api/public';
import { fetchPublicListingContent, listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const params = await searchParams;
  const hasFilter = params.country !== undefined;
  const [seo, listing] = await Promise.all([
    getContentSeo('lineup', { title: 'Artist Lineup | Connection Rave', description: 'Meet the published artists connected to Connection Rave events.' }),
    fetchPublicListingContent(publicApiBaseUrl(), 'lineup-list'),
  ]);
  return buildMetadata({
    title: listing?.seo?.title ?? seo.title,
    description: listing?.seo?.description ?? seo.description,
    image: listing?.seo?.ogImage?.src
      ? { url: listing.seo.ogImage.src, alt: listing.seo.ogImage.alt, width: listing.seo.ogImage.width, height: listing.seo.ogImage.height }
      : undefined,
    path: '/lineup',
    canonicalOverride: seo.canonicalOverride,
    follow: listing?.seo?.follow ?? seo.follow,
    indexable: !hasFilter && (listing?.seo?.index ?? seo.indexable),
  });
}

async function loadLineup(): Promise<
  { data: LineupPageData } | { error: { message: string } }
> {
  const selection = getArtistRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getLineupPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/** Server Component. Only the grid and its filter are interactive. */
export default async function LineupPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadLineup()]);

  if ('error' in result) {
    return <LineupError errorMessage={result.error.message} />;
  }

  const data = result.data;
  const initialFilter = parseCountryFilter(params.country);
  const filter = listingFilter(data.content, 'country-filter', {
    label: 'Filter artists by country',
    options: ['All Artists', 'Vietnam', 'Singapore', 'Australia'],
  });
  const artistsSection = listingSection(data.content, 'artists', {
    title: 'Artists',
    description: 'Same People — Brighter Tomorrow',
  });
  const storySection = listingSection(data.content, 'story', {
    eyebrow: data.story.eyebrow,
    title: data.story.title,
    description: data.story.description,
  });
  const emptyState = listingEmpty(data.content, {
    title: 'The lineup is being prepared.',
    description: 'Artist announcements will appear here.',
    cta: { label: 'Back home', href: '/' },
  });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: data.content?.hero?.breadcrumb ?? 'Lineup' }]}
          eyebrow={data.hero.eyebrow}
          titleLines={data.hero.titleLines}
          description={data.hero.description}
          titleId="lineup-hero-title"
          meta={[
            { icon: 'people', label: `${data.artists.length} Artists` },
            { icon: 'globe', label: 'International & Local' },
            { icon: 'place', label: data.hero.location },
          ]}
          visual={{ src: data.hero.visual.src, alt: data.hero.visual.alt }}
          actions={[
            { ...data.hero.primaryCta, tone: 'primary' },
            { ...data.hero.secondaryCta, tone: 'secondary' },
          ]}
          sideNotes={data.hero.sideNotes}
          footNotes={data.content?.hero?.footNotes}
          badge={data.hero.badge}
        />

        {artistsSection.enabled !== false && (
          <ArtistGrid
            artists={data.artists}
            initialFilter={initialFilter}
            section={artistsSection}
            filterLabel={filter.label}
            filterOptions={filter.options}
            emptyState={emptyState}
          />
        )}

        {storySection.enabled !== false && (
          <LineupStoryBanner story={data.story} section={storySection} />
        )}

        <FinalCtaSection cta={data.finalCta} titleId="lineup-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
