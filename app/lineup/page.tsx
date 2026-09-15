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

export const metadata: Metadata = {
  title: 'Artist Lineup | DESTINY — Connection Rave',
  description:
    'Meet the international and local artists performing as part of the DESTINY lineup by Connection Rave.',
};

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

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Lineup' }]}
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
          badge={data.hero.badge}
        />

        <ArtistGrid artists={data.artists} initialFilter={initialFilter} />

        <LineupStoryBanner story={data.story} />

        <FinalCtaSection cta={data.finalCta} titleId="lineup-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
