import type { Metadata } from 'next';
import { getEventRepository, readEventEnv } from '@/lib/events/repository.server';
import { repositoryErrorMessage } from '@/lib/events/presentation';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';

import Breadcrumb from '@/components/event/Breadcrumb';
import EventAbout from '@/components/event/EventAbout';
import EventExpectations from '@/components/event/EventExpectations';
import EventFinalCta from '@/components/event/EventFinalCta';
import EventFooter from '@/components/event/EventFooter';
import EventHero from '@/components/event/EventHero';
import EventLineup from '@/components/event/EventLineup';
import EventMotion from '@/components/event/EventMotion';
import EventVenue from '@/components/event/EventVenue';
import Header from '@/components/home/Header';
import EventError from './event/error';

export const dynamic = 'force-dynamic';

const ROUTES: FrontendRoutes = {
  tickets: '/tickets',
  tables: '/tables',
  lineup: '/lineup',
  booking: '/book-now',
  legalTerms: '/terms',
  legalPrivacy: '/privacy',
};

async function loadHomeEvent(): Promise<{ data: EventPageData } | { error: string }> {
  const result = await getEventRepository().getPage(readEventEnv().defaultSlug);
  return result.ok ? { data: result.data } : { error: repositoryErrorMessage(result.error) };
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await loadHomeEvent();
  if ('error' in result) return { title: 'Connection Rave', robots: { index: false, follow: false } };
  return { title: result.data.event.seo.title, description: result.data.event.seo.description };
}

export default async function HomePage() {
  const result = await loadHomeEvent();
  if ('error' in result) return <EventError errorMessage={result.error} />;

  return (
    <EventMotion>
      <main className="min-h-screen bg-rave-black text-white">
        <Header ctaHref="/tickets" ctaLabel="Get Tickets" />
        <div className="pt-[84px]">
          <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
            <Breadcrumb trail={[{ label: 'Home' }]} />
          </div>
        </div>
        <EventHero event={result.data} routes={ROUTES} />
        <EventAbout event={result.data} />
        <EventExpectations event={result.data} />
        <EventLineup event={result.data} routes={ROUTES} />
        <EventVenue event={result.data} />
        <EventFinalCta event={result.data} routes={ROUTES} />
        <EventFooter event={result.data} routes={ROUTES} />
      </main>
    </EventMotion>
  );
}
