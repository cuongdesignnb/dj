import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

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

import { getEventRepository } from '@/lib/events/repository.server';
import { buildMetadata } from '@/lib/seo/metadata';
import { breadcrumbSchema } from '@/lib/seo/breadcrumbs';
import { eventSchema, jsonLd } from '@/lib/seo/structured-data';
import type { EventPageData, FrontendRoutes } from '@/lib/events/types';
import { getPublicSlugRedirect } from '@/server/services/slug-history';

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

const ROUTES: FrontendRoutes = {
  tickets: '/tickets',
  tables: '/tables',
  lineup: '/lineup',
  booking: '/book-now',
  legalTerms: '/terms',
  legalPrivacy: '/privacy',
};

async function loadEvent(slug: string): Promise<EventPageData | null> {
  const result = await getEventRepository().getPage(slug);
  if (!result.ok) {
    if (result.error.kind === 'not-found') return null;
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadEvent(slug);
  if (!data) return buildMetadata({ title: 'Event Not Found', description: 'This event is not available.', path: `/events/${slug}`, indexable: false });
  return buildMetadata({ title: data.event.seo.title, description: data.event.seo.description, path: `/events/${data.event.slug}`, canonicalOverride: data.event.seo.canonicalOverride, image: data.event.seo.image ? { url: data.event.seo.image.src, alt: data.event.seo.image.alt, width: data.event.seo.image.width, height: data.event.seo.image.height } : null, indexable: data.event.contentStatus === 'published' && data.event.seo.indexable, follow: data.event.seo.followLinks });
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadEvent(slug);
  if (!data) {
    const redirectSlug = await getPublicSlugRedirect('event', slug);
    if (redirectSlug) permanentRedirect(`/events/${encodeURIComponent(redirectSlug)}`);
    notFound();
  }
  const event = data.event;
  const eventJsonLd = eventSchema({ name: event.name, path: `/events/${event.slug}`, image: event.poster?.src ?? null, description: event.intro, startDate: event.startsAt, endDate: event.endsAt, venue: event.venue });
  const breadcrumbs = breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Events', path: '/events' }, { name: event.title, path: `/events/${event.slug}` }]);

  return (
    <EventMotion>
      <main className="min-h-screen bg-rave-black text-white">
        <Header ctaHref="/tickets" ctaLabel="Get Tickets" />
        <div className="pt-[84px]">
          <div className="mx-auto w-full max-w-[1280px] px-4 pt-6 sm:px-6 lg:px-8">
            <Breadcrumb trail={[{ label: 'Home', href: '/' }, { label: 'Events', href: '/events' }, { label: event.title }]} />
          </div>
        </div>
        <EventHero event={data} routes={ROUTES} />
        <EventAbout event={data} />
        <EventExpectations event={data} />
        <EventLineup event={data} routes={ROUTES} />
        <EventVenue event={data} />
        <EventFinalCta event={data} routes={ROUTES} />
        <EventFooter event={data} routes={ROUTES} />
        {[breadcrumbs, eventJsonLd].filter(Boolean).map((schema, index) => (
          <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) ?? '' }} />
        ))}
      </main>
    </EventMotion>
  );
}
