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
          crumbs={[{ label: 'Home', href: '/' }, { label: data.tablesHero.breadcrumb }]}
          eyebrow={data.tablesHero.eyebrow}
          titleLines={[data.tablesHero.titleLine1, data.tablesHero.titleLine2]}
          description={data.tablesHero.description}
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
          visual={data.tablesHero.image?.src ? data.tablesHero.image : data.event.image}
          titleId="tables-hero-title"
          actions={[
            { label: data.tablesCta.primary.label, href: data.tablesCta.primary.href, tone: 'primary' },
            ...(data.tablesCta.secondary ? [{ label: data.tablesCta.secondary.label, href: data.tablesCta.secondary.href, tone: 'secondary' as const }] : []),
          ]}
          sideNotes={data.tablesHero.sideNotes}
          footNotes={data.tablesHero.footNotes}
        />

        <VipConfigurator data={data} initialSelection={initialSelection} />

        <VipInfoGrid
          items={data.infoItems}
          title={data.tablesMap.infoTitle}
          titleId="vip-information-title"
          context={data.tablesMap.infoContext}
        />

        <FaqAccordion
          items={data.faq}
          titleId="tables-faq-title"
          idPrefix="tables-faq"
          context={data.tablesMap.faqContext}
        />

        <FinalCtaSection cta={data.tablesCta} titleId="tables-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
