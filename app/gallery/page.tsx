import type { Metadata } from 'next';

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

export const metadata: Metadata = {
  title: 'Gallery | Connection Rave',
  description:
    'Explore the Connection Rave gallery preview featuring crowd energy, artist moments, venue visuals and event atmosphere.',
};

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

        <GalleryMosaic
          media={data.previewMedia}
          initialFilter={initialFilter}
          // Says plainly what these images are, so nothing reads as a record of
          // a night that has happened.
          previewNote="Gallery preview | Not from a past event"
        />

        <FeaturedCollection collection={data.featuredCollection} />

        <FinalCtaSection cta={data.finalCta} titleId="gallery-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
