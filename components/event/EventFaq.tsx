import type { EventPageData } from '@/lib/events/types';

export default function EventFaq({ event }: { event: EventPageData }) {
  if (!event.event.faqs.length) return null;
  return (
    <section aria-labelledby="event-faq-title" className="mx-auto w-full max-w-[1120px] px-4 py-16 sm:px-6 lg:px-8">
      <h2 id="event-faq-title" className="font-heading text-3xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
        Event FAQ
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {event.event.faqs.map((faq) => (
          <details key={faq.id || faq.question} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <summary className="cursor-pointer font-semibold text-white">{faq.question}</summary>
            <p className="mt-3 text-sm leading-7 text-white/70">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
