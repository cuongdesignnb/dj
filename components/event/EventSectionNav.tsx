'use client';

import { useEffect, useState } from 'react';
import type { EventPageData } from '@/lib/events/types';

/** Sticky jump links for the event page: Details · Lineup · Tickets · VIP Tables · Bar List · Venue Map. */
export default function EventSectionNav({ event }: { event: EventPageData }) {
  const e = event.event;
  const links = [
    { id: 'about', label: 'Details' },
    ...(e.artists.length ? [{ id: 'lineup', label: 'Lineup' }] : []),
    { id: 'tickets', label: 'Tickets' },
    { id: 'vip-tables', label: 'VIP Tables' },
    ...(e.barList?.length ? [{ id: 'bar-list', label: 'Bar List' }] : []),
    { id: 'venue', label: 'Venue Map' },
  ];
  const [active, setActive] = useState(links[0].id);

  useEffect(() => {
    const sections = links.map((link) => document.getElementById(link.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-140px 0px -55% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
    // Links only change with the page data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links.map((link) => link.id).join()]);

  return (
    <nav aria-label="Event sections" data-event-nav="" className="sticky top-[84px] z-30 border-y border-white/[0.06] bg-rave-black/85 backdrop-blur-md">
      <ul className="mx-auto flex w-full max-w-[1280px] gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-6 lg:px-8">
        {links.map((link) => (
          <li key={link.id} className="shrink-0">
            <a
              href={`#${link.id}`}
              aria-current={active === link.id ? 'true' : undefined}
              className={`inline-flex min-h-[40px] items-center rounded-full px-4 font-heading text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${active === link.id ? 'bg-rave-red text-white' : 'text-rave-muted hover:text-white'}`}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
