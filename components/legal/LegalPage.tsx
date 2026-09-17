import { FileText, Info } from 'lucide-react';

import Header from '@/components/home/Header';
import EventsMotion from '@/components/events/EventsMotion';
import EventsFooter from '@/components/events/EventsFooter';
import FinalCtaSection from '@/components/shared/FinalCtaSection';
import RingHero from '@/components/shared/RingHero';
import Container from '@/components/ui/Container';
import { isDraft } from '@/lib/legal/types';
import type { LegalDocument, LegalDocumentType } from '@/lib/legal/types';
import { SITE_FOOTER } from '@/lib/site-footer';
import LegalSidebar from './LegalSidebar';

const DATE_FORMAT = new Intl.DateTimeFormat('en-AU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: process.env.NEXT_PUBLIC_EVENT_TIME_ZONE ?? 'UTC',
});

const CRUMB: Record<LegalDocumentType, string> = { terms: 'Terms', privacy: 'Privacy' };
const TITLE_FALLBACK: Record<LegalDocumentType, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
};

/** Highlighted note inside a section. */
export function LegalNotice({ children }: { children: string }) {
  return (
    <p className="mt-5 flex items-center gap-3 rounded-[10px] border border-rave-red/70 bg-rave-red/[0.08] px-4 py-3.5 text-base text-white">
      <Info aria-hidden className="h-6 w-6 shrink-0 text-rave-red" strokeWidth={1.6} />
      {children}
    </p>
  );
}

function Meta({ document }: { document: LegalDocument }) {
  const rows = [
    document.version && { label: 'Version', value: document.version },
    document.effectiveDate && {
      label: 'Effective',
      value: DATE_FORMAT.format(new Date(document.effectiveDate)),
    },
    document.updatedAt && {
      label: 'Last updated',
      value: DATE_FORMAT.format(new Date(document.updatedAt)),
    },
  ].filter((row): row is { label: string; value: string } => Boolean(row));
  if (rows.length === 0) return null;
  return (
    <dl className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm text-rave-muted">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-1.5">
          <dt>{row.label}:</dt>
          <dd className="text-white">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Shared layout for /terms and /privacy. Server-rendered: the whole document
 * is in the initial HTML, and only the section tracker runs in the browser.
 */
export default function LegalPage({
  type,
  document,
}: {
  type: LegalDocumentType;
  document: LegalDocument | null;
}) {
  const crumbs = [{ label: 'Home', href: '/' }, { label: CRUMB[type] }];
  const sections = document ? [...document.sections].sort((a, b) => a.sortOrder - b.sortOrder) : [];

  return (
    <EventsMotion>
      <Header />
      <main id="main" className="min-h-screen bg-rave-black text-white">
        <RingHero
          crumbs={crumbs}
          eyebrow={document?.eyebrow ?? 'Legal'}
          title={document?.title ?? TITLE_FALLBACK[type]}
          description={
            document?.intro ??
            'This legal document is currently being prepared. Please contact us for more information.'
          }
          // The badge stays until the source marks the document published.
          badge={!document || isDraft(document) ? 'Draft for review' : null}
          visual={{ src: '/assets/hero-crowd.jpg', alt: '' }}
          sideNotes={['MUSIC', 'PEOPLE', 'CULTURE', 'CONNECTION']}
          titleId="legal-hero-title"
          calm
        />

        <section aria-label="Document" className="bg-rave-black py-10 md:py-14">
          <Container>
            {document && sections.length > 0 ? (
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,28fr)_minmax(0,72fr)]">
                <LegalSidebar
                  items={sections.map((s) => ({ id: s.id, label: s.navLabel }))}
                  withIcons={type === 'terms'}
                />

                <article
                  aria-labelledby="legal-hero-title"
                  className="rounded-[14px] border border-white/[0.1] bg-rave-panel/60 px-5 py-6 sm:px-8 sm:py-8"
                >
                  <Meta document={document} />
                  <div className="max-w-[760px] divide-y divide-white/[0.1]">
                    {sections.map((section, index) => (
                      <section
                        key={section.id}
                        id={section.id}
                        aria-labelledby={`${section.id}-title`}
                        className="legal-fade-up scroll-mt-[110px] py-6 first:pt-0 last:pb-0"
                        style={{ animationDelay: `${Math.min(index, 5) * 60}ms` }}
                      >
                        <h2
                          id={`${section.id}-title`}
                          className="font-heading text-3xl font-black uppercase tracking-tight text-white"
                        >
                          {index + 1}. {section.title}
                        </h2>
                        {section.paragraphs.map((paragraph) => (
                          <p
                            key={paragraph}
                            className="mt-3 text-base leading-[1.7] text-white/80 sm:text-[17px]"
                          >
                            {paragraph}
                          </p>
                        ))}
                        {section.notice && <LegalNotice>{section.notice}</LegalNotice>}
                      </section>
                    ))}
                  </div>
                </article>
              </div>
            ) : (
              <div className="mx-auto max-w-xl rounded-[14px] border border-white/[0.1] bg-rave-panel/60 px-6 py-12 text-center">
                <FileText aria-hidden className="mx-auto h-10 w-10 text-rave-red" strokeWidth={1.5} />
                <p className="mt-4 text-base leading-relaxed text-white/85">
                  This legal document is currently being prepared. Please contact us for more
                  information.
                </p>
              </div>
            )}
          </Container>
        </section>

        <FinalCtaSection
          compact
          cta={{
            title: document?.finalCta.title ?? 'NEED MORE HELP?',
            primary: document?.finalCta.primary ?? { label: 'Contact Us', href: '/contact' },
            secondary: document?.finalCta.secondary ?? { label: 'Explore Event', href: '/event' },
            background: { src: '/assets/hero-crowd.jpg', alt: '' },
          }}
          titleId="legal-cta-title"
        />
      </main>
      <EventsFooter footer={SITE_FOOTER} />
    </EventsMotion>
  );
}
