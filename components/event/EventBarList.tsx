'use client';

import Image from 'next/image';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import type { EventPageData } from '@/lib/events/types';

/** Drinks menu from Admin › Event page content › Bar list, or the VIP bottle choices. Hidden when empty. */
export default function EventBarList({ event }: { event: EventPageData }) {
  const items = event.event.barList ?? [];
  if (items.length === 0) return null;
  const groups = items.reduce<Array<{ category: string; items: typeof items }>>((all, item) => {
    const category = item.category || 'Drinks';
    const group = all.find((entry) => entry.category === category);
    if (group) group.items.push(item);
    else all.push({ category, items: [item] });
    return all;
  }, []);

  return (
    <section id="bar-list" aria-labelledby="event-bar-title" className="scroll-mt-32 bg-rave-black py-16 md:py-24">
      <Container>
        <EventSectionHeading eyebrow="Bar List" title="Drinks & Bottles" id="event-bar-title" align="left" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <div key={group.category} className="rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-6">
              <h3 className="font-heading text-sm font-bold uppercase tracking-[0.22em] text-rave-red">{group.category}</h3>
              <ul className="mt-4 divide-y divide-white/[0.06]">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-4 py-3">
                    {item.image && (
                      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-rave-deep">
                        <Image src={item.image.src} alt="" fill sizes="56px" className="object-contain p-1" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-4">
                        <span className="font-heading text-base font-semibold uppercase tracking-wide text-white">{item.name}</span>
                        {item.price && <span className="shrink-0 font-heading text-base font-bold text-white">{item.price}</span>}
                      </p>
                      {item.description && <p className="mt-0.5 text-sm text-rave-muted">{item.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
