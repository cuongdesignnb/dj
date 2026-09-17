import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import ArtistProfile from '@/components/artists/ArtistProfile';

import { getArtistRepository } from '@/lib/artists/repository';
import { relatedArtists } from '@/lib/artists/helpers';
import type { Artist } from '@/lib/artists/types';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { jsonLd } from '@/lib/seo/structured-data';
import { isThinProfile } from '@/lib/seo/indexability';
import LineupError from '../error';
import { getPublicSlugRedirect } from '@/server/services/slug-history';

/**
 * The lineup is a known, finite set, so only the slugs generateStaticParams
 * returns are routable. Anything else is a real 404 from the router.
 *
 * Without this, an unknown slug renders the not-found UI but Next caches that
 * prerender and answers 200 — the page looks right and the status lies. The
 * cost is that artists added to a future API only become reachable on the next
 * build; revisit this if the lineup starts changing between deploys.
 */
export const dynamicParams = true;
export const dynamic = 'force-dynamic';

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
    return buildMetadata({ title: 'Artist Not Found', description: 'This artist profile is not available.', path: `/lineup/${slug}`, indexable: false });
  }

  const artist = result.artist;
  const description = artist.seoDescription ?? `Published artist profile for ${artist.name}.`;
  return buildMetadata({ title: artist.seoTitle ?? `${artist.name} | Connection Rave`, description, path: `/lineup/${artist.slug}`, canonicalOverride: artist.canonicalOverride, image: artist.portrait.src ? { url: artist.portrait.src, alt: artist.portrait.alt, width: artist.portrait.width, height: artist.portrait.height } : null, indexable: artist.indexable !== false && !isThinProfile({ bio: artist.bio, mediaCount: artist.media.length }), follow: artist.followLinks });
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
    const redirectSlug = await getPublicSlugRedirect('artist', slug);
    if (redirectSlug) permanentRedirect(`/lineup/${encodeURIComponent(redirectSlug)}`);
    notFound();
  }

  const artist = result.artist;

  const selection = getArtistRepository();
  const all = selection.ok ? await selection.repository.getArtists() : null;
  const related = all?.ok ? relatedArtists(all.data, artist) : [];
  const page = selection.ok ? await selection.repository.getLineupPage() : null;
  const breadcrumbs = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Lineup', path: '/lineup' }, { name: artist.name, path: `/lineup/${artist.slug}` }]);

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <ArtistProfile artist={artist} related={related} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) ?? '' }} />
      </main>
      <EventsFooter footer={page?.ok ? page.data.footer : { email: null, phone: null, socials: [], legalTermsHref: '/terms', legalPrivacyHref: '/privacy' }} />
    </EventsMotion>
  );
}
