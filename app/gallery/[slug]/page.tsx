import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import PageHero from '@/components/shared/PageHero';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import CollectionView from '@/components/gallery/CollectionView';
import RelatedCollections from '@/components/gallery/RelatedCollections';

import { getGalleryRepository } from '@/lib/gallery/repository';
import { countPhotos, countVideos, statusLabel } from '@/lib/gallery/helpers';
import type { GalleryCollection } from '@/lib/gallery/types';
import GalleryError from '../error';

/**
 * Collections are a known, finite set, so only the slugs generateStaticParams
 * returns are routable and anything else is a real router 404. Without this an
 * unknown slug renders the not-found UI but Next caches that prerender and
 * answers 200 — the page looks right while the status lies.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const selection = getGalleryRepository();
  if (!selection.ok) return [];

  const result = await selection.repository.getCollections();
  if (!result.ok) return [];

  return result.data.map((collection) => ({ slug: collection.slug }));
}

async function loadCollection(
  slug: string,
): Promise<{ collection: GalleryCollection | null } | { error: { message: string } }> {
  const selection = getGalleryRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getCollectionBySlug(slug);
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { collection: result.data };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadCollection(slug);

  if ('error' in result || !result.collection) {
    return {
      title: 'Collection Not Found | Connection Rave',
      description: 'This gallery collection is not available.',
      robots: { index: false, follow: true },
    };
  }

  const collection = result.collection;
  // A preview is described as a preview — never as event photography.
  const preview = collection.status !== 'published';
  const title = preview
    ? `${collection.title} Gallery Preview | Connection Rave`
    : `${collection.title} Gallery | Connection Rave`;
  const description = preview
    ? `Explore the ${collection.title} gallery preview with crowd, artist, venue and production visuals from the Connection Rave experience.`
    : (collection.description ??
      `Explore the ${collection.title} gallery from Connection Rave.`);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: collection.cover.src
        ? [{ url: collection.cover.src, alt: collection.cover.alt }]
        : [],
    },
  };
}

export default async function GalleryCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadCollection(slug);

  if ('error' in result) {
    return <GalleryError errorMessage={result.error.message} />;
  }
  if (!result.collection) {
    notFound();
  }

  const collection = result.collection;
  const hero = collection.hero ?? collection.cover;
  const photos = countPhotos(collection);
  const videos = countVideos(collection);

  const selection = getGalleryRepository();
  const all = selection.ok ? await selection.repository.getCollections() : null;
  const related = all?.ok
    ? all.data.filter((candidate) => candidate.slug !== collection.slug)
    : [];
  const page = selection.ok ? await selection.repository.getGalleryPage() : null;

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[
            { label: 'Home', href: '/' },
            { label: 'Gallery', href: '/gallery' },
            { label: collection.title },
          ]}
          eyebrow={statusLabel(collection)}
          titleLines={[collection.title]}
          description={collection.description ?? ''}
          titleId="collection-hero-title"
          meta={[
            ...(collection.venue
              ? [{ icon: 'place' as const, label: collection.venue }]
              : []),
            { icon: 'globe' as const, label: statusLabel(collection) },
            {
              icon: 'people' as const,
              label: videos > 0 ? 'Images & Video' : `${photos} Images`,
            },
          ]}
          visual={{ src: hero.src, alt: hero.alt }}
          sideNotes={['MUSIC', 'PEOPLE', 'CULTURE', 'A BRIGHTER TOMORROW']}
        />

        <CollectionView collection={collection} />

        <RelatedCollections collections={related} />

        <FinalCtaSection
          cta={{
            title: `EXPLORE THE ${collection.title} EXPERIENCE`,
            subtitle: 'Same people. A brighter tomorrow.',
            primary: { label: 'View Event', href: collection.eventHref ?? '/event' },
            secondary: { label: 'Get Tickets', href: '/tickets' },
            background: page?.ok ? page.data.finalCta.background : undefined,
          }}
          titleId="collection-cta-title"
        />
      </main>
      <EventsFooter footer={page?.ok ? page.data.footer : { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' }} />
    </EventsMotion>
  );
}
