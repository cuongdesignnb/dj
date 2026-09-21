import Link from 'next/link';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FaqAccordion from '@/components/shared/FaqAccordion';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import PageHero from '@/components/shared/PageHero';
import VipInfoGrid from '@/components/vip/VipInfoGrid';
import BookingRequestForm from '@/components/vip/BookingRequestForm';

import { getVipRepository } from '@/lib/vip/repository';
import { parseVipSelection } from '@/lib/vip/selection';
import type { VipPageData } from '@/lib/vip/types';
import BookNowError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<ReturnType<typeof buildMetadata>> {
  const result = await loadVipPage();
  const title = 'VIP Booking Request | Connection Rave';
  const description = 'Send a VIP table booking request and share your preferred booth, group size and bottle selection.';
  if ('error' in result) return buildMetadata({ title, description, path: '/book-now', indexable: false, follow: false });
  return buildMetadata({ title: `${result.data.event.title} VIP Booking Request | Connection Rave`, description, path: '/book-now', indexable: false, follow: false });
}

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

/** Experience switch in the hero. Tickets is a link out; VIP Table is this page. */
function ExperienceTabs({ labels }: { labels: { tickets: string; vip: string } }) {
  return (
    <div role="group" aria-label="Choose an experience" className="flex flex-wrap gap-3">
      <Link
        href="/tickets"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-white/[0.12] bg-white/[0.02] px-6 font-heading text-sm font-semibold uppercase tracking-wider text-rave-muted transition-all duration-300 hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
      >
        {labels.tickets}
      </Link>
      <span
        aria-current="page"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] border border-rave-red bg-rave-red/12 px-6 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(255,23,61,0.28)]"
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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, result] = await Promise.all([searchParams, loadVipPage()]);

  if ('error' in result) {
    return <BookNowError errorMessage={result.error.message} />;
  }

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
          <ExperienceTabs labels={data.bookingTabs} />
        </PageHero>

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
