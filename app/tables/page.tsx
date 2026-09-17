import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FaqAccordion from '@/components/shared/FaqAccordion';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import PageHero from '@/components/shared/PageHero';
import VipConfigurator from '@/components/vip/VipConfigurator';
import VipInfoGrid from '@/components/vip/VipInfoGrid';

import { getVipRepository } from '@/lib/vip/repository';
import { parseVipSelection } from '@/lib/vip/selection';
import type { VipPageData } from '@/lib/vip/types';
import TablesError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

async function loadVipPage(): Promise<
  { data: VipPageData } | { error: { message: string } }
> {
  const selection = getVipRepository();
  if (!selection.ok) {
    return { error: { message: selection.error.message } };
  }

  const result = await selection.repository.getVipPage();
  if (!result.ok) {
    return { error: { message: result.error.message } };
  }

  return { data: result.data };
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await loadVipPage();
  if ('error' in result) return buildMetadata({ title: 'VIP Tables | Connection Rave', description: 'VIP table information from Connection Rave.', path: '/tables', indexable: false });
  const event = result.data.event;
  return buildMetadata({ title: `${event.title} VIP Tables | Connection Rave`, description: `Review VIP table and bottle information for ${event.title}. Availability is confirmed directly with the team.`, path: '/tables', image: event.image.src ? { url: event.image.src, alt: event.image.alt, width: event.image.width, height: event.image.height } : null, indexable: true });
}

/**
 * Server Component. Only the configurator is interactive; the booth and bottle
 * choice it holds travels to /book-now as identifiers in the URL.
 */
export default async function TablesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadVipPage()]);

  if ('error' in result) {
    return <TablesError errorMessage={result.error.message} />;
  }

  const data = result.data;
  // Lets /tables itself be deep-linked with a selection, and keeps a round trip
  // back from /book-now from losing what was already chosen.
  const initialSelection = parseVipSelection(params, data);

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: 'Table' }]}
          eyebrow="VIP Tables"
          titleLines={['YOUR NIGHT.', 'YOUR BOOTH.']}
          description={`An elevated VIP experience for ${data.event.title}. Premium booths, bottle service and the best views in the house — at ${data.event.venue}.`}
          meta={[
            {
              icon: 'date' as const,
              label:
                data.event.dateStatus === 'confirmed' && data.event.date
                  ? data.event.date
                  : 'Date to be announced',
            },
            {
              icon: 'time' as const,
              label:
                data.event.scheduleStatus === 'confirmed' && data.event.schedule
                  ? data.event.schedule
                  : 'Schedule to be confirmed',
            },
            { icon: 'place' as const, label: data.event.venue },
          ]}
          visual={{ src: data.event.image.src, alt: data.event.image.alt }}
          titleId="tables-hero-title"
          actions={[
            { label: 'Request a Booth', href: '#club-map', tone: 'primary' },
            { label: 'View Club Map', href: '#club-map', tone: 'secondary' },
          ]}
          sideNotes={['PEOPLE', 'MUSIC', 'CULTURE', 'FOREVER']}
          footNotes={['VIP MUSIC ENERGY', 'A BRIGHTER TOMORROW']}
        />

        <VipConfigurator data={data} initialSelection={initialSelection} />

        <VipInfoGrid
          items={data.infoItems}
          title="VIP Information"
          titleId="vip-information-title"
          context="Same People — Brighter Tomorrow"
        />

        <FaqAccordion
          items={data.faq}
          titleId="tables-faq-title"
          idPrefix="tables-faq"
          context="Get The Answers — VIP Ready"
        />

        <FinalCtaSection cta={data.tablesCta} titleId="tables-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
