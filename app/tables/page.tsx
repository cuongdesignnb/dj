import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FaqAccordion from '@/components/shared/FaqAccordion';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import PageHero from '@/components/shared/PageHero';
import VipConfigurator from '@/components/vip/VipConfigurator';
import VipInfoGrid from '@/components/vip/VipInfoGrid';

import { loadVipPage } from '@/lib/vip/page';
import { parseVipSelection } from '@/lib/vip/selection';
import VipStateNotice, { VipAvailabilityNotice } from '@/components/vip/VipStateNotice';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const result = await loadVipPage();
  const event = 'data' in result ? result.data.event : 'event' in result ? result.event : null;
  if (!event) return buildMetadata({ title: 'VIP Tables | Connection Rave', description: 'VIP table information from Connection Rave.', path: '/tables', indexable: false });
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

  if (!('data' in result)) return <VipStateNotice state={result} page="tables" />;

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
          actions={result.canRequest ? [
            { label: data.tablesCta.primary.label, href: data.tablesCta.primary.href, tone: 'primary' },
            ...(data.tablesCta.secondary ? [{ label: data.tablesCta.secondary.label, href: data.tablesCta.secondary.href, tone: 'secondary' as const }] : []),
          ] : []}
          sideNotes={data.tablesHero.sideNotes}
          footNotes={data.tablesHero.footNotes}
        />

        <VipAvailabilityNotice state={result} />
        <VipConfigurator data={data} initialSelection={initialSelection} canRequest={result.canRequest} />

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

        {result.canRequest && <FinalCtaSection cta={data.tablesCta} titleId="tables-cta-title" />}
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
