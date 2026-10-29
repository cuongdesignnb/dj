import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import RichText from '@/components/shared/RichText';
import type { EventPageData } from '@/lib/events/types';

/** Questions saved on the event (Admin › Events › FAQ tab). */
export default function EventFaq({ event }: { event: EventPageData }) {
  if (!event.event.faqs.length) return null;
  return (
    <section id="faq" aria-labelledby="event-faq-title" className="py-16 md:py-24 bg-rave-deep">
      <Container>
        <EventSectionHeading eyebrow="FAQ" title="Event FAQ" id="event-faq-title" align="left" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {event.event.faqs.map((faq) => (
            <details key={faq.id || faq.question} className="group rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-5 open:border-rave-red/40">
              <summary className="cursor-pointer list-none font-heading text-base font-semibold uppercase tracking-wide text-white marker:hidden">
                <span className="flex items-start justify-between gap-4">{faq.question}<span aria-hidden className="text-rave-red transition-transform group-open:rotate-45">+</span></span>
              </summary>
              <div className="mt-3 text-sm leading-7 text-white/70"><RichText text={faq.answer} /></div>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
