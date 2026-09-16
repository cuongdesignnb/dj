import type { Metadata } from 'next';
import { getEventRepository, readEventEnv } from '@/lib/events/repository.server';
import { repositoryErrorMessage } from '@/lib/events/presentation';
import { EventPageData, FrontendRoutes } from '@/lib/events/types';

import Header from '@/components/home/Header';
import Breadcrumb from '@/components/event/Breadcrumb';
import EventMotion from '@/components/event/EventMotion';
import EventHero from '@/components/event/EventHero';
import EventAbout from '@/components/event/EventAbout';
import EventExpectations from '@/components/event/EventExpectations';
import EventLineup from '@/components/event/EventLineup';
import EventVenue from '@/components/event/EventVenue';
import EventFinalCta from '@/components/event/EventFinalCta';
import EventFooter from '@/components/event/EventFooter';
import EventError from './error';

// Frontend-owned route table. Pages that don't exist yet (tickets, tables,
// lineup, booking, legal) resolve to fallback anchors per spec — never to
// fake checkout/payment pages.
const ROUTES: FrontendRoutes = {
  tickets: null,
  tables: null,
  lineup: null,
  booking: null,
  legalTerms: '/terms',
  legalPrivacy: '/privacy',
};

async function loadEventData(): Promise<{ data: EventPageData } | { error: { message: string } }> {
  const env = readEventEnv();
  const slug = env.defaultSlug;

  // For sites configured for HTTP, missing base URL is a config error, not
  // a silent fallback to mock.
  if (env.source === 'http' && !env.baseUrl) {
    return {
      error: {
        message:
          'EVENT_DATA_SOURCE=http requires EVENT_API_BASE_URL to be configured.',
      },
    };
  }

  const repo = getEventRepository();
  const result = await repo.getPage(slug);
  if (!result.ok) {
    return { error: { message: repositoryErrorMessage(result.error) } };
  }
  return { data: result.data };
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await loadEventData();
  if ('error' in result) {
    return {
      title: 'DESTINY — Event Details',
      description: 'Event details for Connection Rave.',
      robots: { index: false, follow: false },
    };
  }
  const e = result.data.event;
  const env = readEventEnv();
  const preview = e.contentStatus === 'preview';
  const og = e.seo.image
    ? [{ url: e.seo.image.src, width: e.seo.image.width, height: e.seo.image.height, alt: e.seo.image.alt }]
    : [];
  const metadata: Metadata = {
    title: e.seo.title,
    description: e.seo.description,
    openGraph: {
      title: e.seo.title,
      description: e.seo.description,
      images: og,
    },
    twitter: {
      card: 'summary_large_image',
      title: e.seo.title,
      description: e.seo.description,
      images: og.map((o) => o.url),
    },
  };
  if (preview) {
    metadata.robots = { index: false, follow: false };
  }
  if (env.siteUrl) {
    metadata.alternates = { canonical: `${env.siteUrl.replace(/\/$/, '')}/event` };
  }
  return metadata;
}

export default async function EventPage() {
  const result = await loadEventData();
  if ('error' in result) {
    return <EventError errorMessage={result.error.message} />;
  }
  const data = result.data;
  const e = data.event;

  return (
    <EventMotion>
      <main className="min-h-screen bg-rave-black text-white">
        <Header ctaHref="/event#tickets" ctaLabel="Get Tickets" />
        <div className="pt-[84px]">
          <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-6">
            <Breadcrumb
              trail={[
                { label: 'Home', href: '/' },
                { label: 'Event' },
              ]}
            />
          </div>
        </div>
        <EventHero event={data} routes={ROUTES} />
        <EventAbout event={data} />
        <EventExpectations event={data} />
        <EventLineup event={data} routes={ROUTES} />
        <EventVenue event={data} />
        <EventFinalCta event={data} routes={ROUTES} />
        <EventFooter event={data} routes={ROUTES} />

        {/* JSON-LD only for published content — preview stays noindex */}
        {e.contentStatus === 'published' && e.startsAt && e.endsAt && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'MusicEvent',
                name: e.name,
                startDate: e.startsAt,
                endDate: e.endsAt,
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                eventStatus: 'https://schema.org/EventScheduled',
                location: {
                  '@type': 'Place',
                  name: e.venue.name,
                  address: e.venue.address ?? e.venue.city,
                },
                description: e.intro,
              }),
            }}
          />
        )}
      </main>
    </EventMotion>
  );
}
