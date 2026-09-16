import type { Metadata } from 'next';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import FaqBrowser from '@/components/support/FaqBrowser';

import { SITE_FOOTER } from '@/lib/site-footer';
import { getFaqRepository } from '@/lib/support/faq-repository';
import FaqError from './error';

// No FAQPage JSON-LD: several answers are still "to be confirmed", and
// structured data would present them as settled.
export const metadata: Metadata = {
  title: 'FAQ | Connection Rave',
  description:
    'Find answers about Connection Rave tickets, entry, VIP table requests, venue information and event updates.',
};

/** Server Component. Search, categories and the accordion are the client island. */
export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const selection = getFaqRepository();
  const result = selection.ok ? await selection.repository.getFaqPage() : null;

  if (!selection.ok || !result?.ok) {
    const message = !selection.ok
      ? selection.error.message
      : result && !result.ok
        ? result.error.message
        : undefined;
    return <FaqError errorMessage={message} />;
  }

  const data = result.data;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const initialQuery = typeof rawQuery === 'string' ? rawQuery.slice(0, 80) : '';

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <FaqBrowser data={data} initialQuery={initialQuery} />

        <FinalCtaSection
          cta={{
            title: data.finalCta.title,
            subtitle: data.finalCta.description,
            primary: data.finalCta.primary,
            secondary: data.finalCta.secondary,
            background: data.finalCta.background,
          }}
          titleId="faq-cta-title"
        />
      </main>
      <EventsFooter footer={SITE_FOOTER} />
    </EventsMotion>
  );
}
