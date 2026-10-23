import { NavigationLink as Link } from '@/components/shared/NavigationFeedback';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FaqAccordion from '@/components/shared/FaqAccordion';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import PageHero from '@/components/shared/PageHero';
import VipInfoGrid from '@/components/vip/VipInfoGrid';
import BookingRequestForm from '@/components/vip/BookingRequestForm';

import { loadScopedVipPage, type PageSearchParams } from '@/lib/vip/page';
import { eventScopedHref } from '@/lib/events/event-scope';
import { parseVipSelection } from '@/lib/vip/selection';
import VipStateNotice, { VipAvailabilityNotice } from '@/components/vip/VipStateNotice';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata({ searchParams }: { searchParams: Promise<PageSearchParams> }): Promise<ReturnType<typeof buildMetadata>> {
  const { result } = await loadScopedVipPage(searchParams);
  const title = 'VIP Booking Request | Connection Rave';
  const description = 'Send a VIP table booking request and share your preferred booth, group size and bottle selection.';
  const event = 'data' in result ? result.data.event : 'event' in result ? result.event : null;
  return buildMetadata({ title: event ? `${event.title} VIP Booking Request | Connection Rave` : title, description, path: '/book-now', indexable: false, follow: false });
}

/** Experience switch in the hero. Tickets is a link out; VIP Table is this page. */
function ExperienceTabs({ labels, ticketsHref }: { labels: { tickets: string; vip: string }; ticketsHref: string }) {
  return (
    <div role="group" aria-label="Choose an experience" className="flex flex-wrap gap-3">
      <Link
        href={ticketsHref}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-white/[0.12] bg-white/[0.02] px-6 font-heading text-sm font-semibold uppercase tracking-wider text-rave-muted transition-all duration-300 hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
      >
        {labels.tickets}
      </Link>
      <span
        aria-current="page"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-rave-red bg-rave-red/12 px-6 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgb(var(--rave-accent-rgb)/0.28)]"
      >
        {labels.vip}
      </span>
    </div>
  );
}

/**
 * Server Component. The form is the only client island; it reads its starting
 * booth and bottle choice from the query, validated against canonical data.
 */
export default async function BookNowPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const { params, eventSlug, result } = await loadScopedVipPage(searchParams);

  if (!('data' in result) || !result.canRequest) return <VipStateNotice state={result} page="booking" />;

  const data = result.data;
  // Unknown booth or bottle ids are dropped here, so a tampered link cannot
  // put anything into the form that the canonical data does not recognise.
  const initialSelection = parseVipSelection(params, data);

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <PageHero
          crumbs={[{ label: 'Home', href: '/' }, { label: data.bookingHero.breadcrumb }]}
          eyebrow={data.bookingHero.eyebrow}
          titleLines={[data.bookingHero.titleLine1, data.bookingHero.titleLine2]}
          description={data.bookingHero.description}
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
          visual={data.bookingHero.image?.src ? data.bookingHero.image : data.event.image}
          titleId="book-now-hero-title"
          sideNotes={data.bookingHero.sideNotes}
          footNotes={data.bookingHero.footNotes}
        >
          <ExperienceTabs labels={data.bookingTabs} ticketsHref={eventScopedHref('/tickets', eventSlug)} />
        </PageHero>

        <VipAvailabilityNotice state={result} />
        <BookingRequestForm data={data} content={data.bookingForm} initialSelection={initialSelection} />

        <VipInfoGrid
          items={data.bookingNotes}
          title={data.bookingForm.notesTitle}
          titleId="booking-notes-title"
          context={data.bookingForm.notesContext}
        />

        <FaqAccordion
          items={data.bookingFaq}
          titleId="book-now-faq-title"
          idPrefix="book-now-faq"
          context={data.bookingForm.faqContext}
        />

        <FinalCtaSection cta={data.bookingCta} titleId="book-now-cta-title" />
      </main>
      <EventsFooter footer={data.footer} />
    </EventsMotion>
  );
}
