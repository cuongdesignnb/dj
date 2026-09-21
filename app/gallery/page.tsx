import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import PageHero from '@/components/shared/PageHero';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import GalleryMosaic from '@/components/gallery/GalleryMosaic';
import FeaturedCollection from '@/components/gallery/FeaturedCollection';

import { getGalleryRepository } from '@/lib/gallery/repository';
import type { GalleryCategoryFilter, GalleryPageData } from '@/lib/gallery/types';
import { availableCategories } from '@/lib/gallery/helpers';
import GalleryError from './error';
import { buildMetadata } from '@/lib/seo/metadata';
import { getContentSeo } from '@/lib/seo/content';
import { listingEmpty, listingFilter, listingSection } from '@/lib/cms/public-page';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const filter = Array.isArray(params.category) ? params.category[0] : params.category;
  const result = await loadGallery();
  const hasPublished = 'data' in result && result.data.collections.some((collection) => collection.status === 'published' && collection.indexable !== false);
  const seo = await getContentSeo('gallery', { title: 'Gallery | Connection Rave', description: 'Explore published Connection Rave visual collections, artist moments, venue visuals and event atmosphere.' });
  return buildMetadata({ ...seo, path: '/gallery', indexable: !filter && hasPublished && seo.indexable });
}

async function loadGallery(): Promise<
  { data: GalleryPageData } | { error: { message: string } }
> {
  const selection = getGalleryRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getGalleryPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

/** Server Component. The mosaic, its filter and the viewers are the client island. */
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadGallery()]);

  if ('error' in result) {
    return <GalleryError errorMessage={result.error.message} />;
  }

  const data = result.data;

  // Only honour a category the media actually contains.
  const requested = (Array.isArray(params.category) ? params.category[0] : params.category)
    ?.trim()
    .toLowerCase();
  const options = availableCategories(data.previewMedia);
  const initialFilter: GalleryCategoryFilter = options.includes(
    requested as GalleryCategoryFilter,
  )
    ? (requested as GalleryCategoryFilter)
    : 'all';
  const filter = listingFilter(data.content, 'gallery-filter', {
    label: 'Filter gallery by category',
    options: ['All', 'Crowd', 'Artists', 'Venue', 'Production', 'Video', 'Other'],
  });
  const gallerySection = listingSection(data.content, 'gallery', {
    title: 'Gallery',
    description: 'Gallery Preview — Moments That Inspire',
  });
  const featuredSection = listingSection(data.content, 'featured', {
    title: 'Featured Collection',
    description: 'Music × People × Culture × A Brighter Tomorrow',
  });
  const emptyState = listingEmpty(data.content, {
    title: 'The gallery is being prepared.',
    description: 'Visual collections will appear here.',
    cta: { label: 'Back home', href: '/' },
  });

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Gallery' }]}
          eyebrow={data.hero.eyebrow}
          titleLines={data.hero.titleLines}
          description={data.hero.description}
          titleId="gallery-hero-title"
          meta={[]}
          visual={{ src: data.hero.visual.src, alt: data.hero.visual.alt }}
          actions={[
            { ...data.hero.primaryCta, tone: 'primary' },
            { ...data.hero.secondaryCta, tone: 'secondary' },
          ]}
          sideNotes={data.hero.sideNotes}
        />

        <div id="collections">
          {gallerySection.enabled !== false && (
            <GalleryMosaic
              media={data.previewMedia}
              initialFilter={initialFilter}
              // Says plainly what these images are, so nothing reads as a record of
              // a night that has happened.
              previewNote={gallerySection.description}
              section={gallerySection}
              filterLabel={filter.label}
              filterOptions={filter.options}
              emptyState={emptyState}
            />
          )}
        </div>

        {featuredSection.enabled !== false && (
          <FeaturedCollection collection={data.featuredCollection} section={featuredSection} />
        )}

        <FinalCtaSection cta={data.finalCta} titleId="gallery-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
