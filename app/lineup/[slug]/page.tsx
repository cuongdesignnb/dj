import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import ArtistProfile from '@/components/artists/ArtistProfile';

import { getArtistRepository } from '@/lib/artists/repository';
import { relatedArtists } from '@/lib/artists/helpers';
import { LINEUP_MOCK } from '@/lib/artists/mock';
import type { Artist } from '@/lib/artists/types';
import LineupError from '../error';

/**
 * The lineup is a known, finite set, so only the slugs generateStaticParams
 * returns are routable. Anything else is a real 404 from the router.
 *
 * Without this, an unknown slug renders the not-found UI but Next caches that
 * prerender and answers 200 — the page looks right and the status lies. The
 * cost is that artists added to a future API only become reachable on the next
 * build; revisit this if the lineup starts changing between deploys.
 */
export const dynamicParams = false;

/**
 * One dynamic route serves every artist — there are no per-artist page files.
 */
export async function generateStaticParams() {
  const selection = getArtistRepository();
  if (!selection.ok) return [];

  const result = await selection.repository.getArtists();
  if (!result.ok) return [];

  return result.data.map((artist) => ({ slug: artist.slug }));
}

async function loadArtist(
  slug: string,
): Promise<{ artist: Artist | null } | { error: { message: string } }> {
  const selection = getArtistRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getArtistBySlug(slug);
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { artist: result.data };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadArtist(slug);

  if ('error' in result || !result.artist) {
    return {
      title: 'Artist Not Found | DESTINY — Connection Rave',
      description: 'This artist profile is not available.',
      robots: { index: false, follow: true },
    };
  }

  const artist = result.artist;
  // The description never quotes a bio the artist does not have.
  return {
    title: `${artist.name} | DESTINY Artist — Connection Rave`,
    description: `Meet ${artist.name}, part of the DESTINY artist lineup by Connection Rave.`,
    openGraph: {
      title: `${artist.name} | DESTINY Artist`,
      description: `Meet ${artist.name}, part of the DESTINY artist lineup by Connection Rave.`,
      images: artist.portrait.src
        ? [{ url: artist.portrait.src, alt: artist.portrait.alt }]
        : [],
    },
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadArtist(slug);

  if ('error' in result) {
    return <LineupError errorMessage={result.error.message} />;
  }
  if (!result.artist) {
    notFound();
  }

  const artist = result.artist;

  const selection = getArtistRepository();
  const all = selection.ok ? await selection.repository.getArtists() : null;
  const related = all?.ok ? relatedArtists(all.data, artist) : [];

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <ArtistProfile artist={artist} related={related} />
      </main>
      <EventsFooter footer={LINEUP_MOCK.footer} />
    </EventsMotion>
  );
}
