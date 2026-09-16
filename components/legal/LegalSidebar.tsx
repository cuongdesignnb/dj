'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, ChevronRight, Crown, FileText, LogIn, Mail, Ticket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface LegalNavItem {
  id: string;
  label: string;
}

// Terms sections carry icons in the approved design; other documents use a
// plain list with chevrons.
const ICONS: Record<string, LucideIcon> = {
  ticketing: Ticket,
  entry: LogIn,
  'vip-requests': Crown,
  cancellations: FileText,
  contact: Mail,
};

/**
 * "On this page" navigation. Links are plain anchors, so they work without
 * JavaScript; an IntersectionObserver marks the section being read.
 */
export default function LegalSidebar({
  items,
  withIcons,
}: {
  items: LegalNavItem[];
  withIcons: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // The observer only says *when* a section crosses the reading line; the
    // active section is then the last one whose top has passed that line, or
    // the first section when the reader is above all of them.
    const pick = () => {
      // Anchored sections land 110px down (scroll-mt), just under the header.
      const line = 140;
      let current = targets[0].id;
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      // At the very bottom a short last section can never reach the line.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && targets[targets.length - 1].getBoundingClientRect().top < window.innerHeight) {
        current = targets[targets.length - 1].id;
      }
      setActiveId(current);
    };
    const observer = new IntersectionObserver(pick, {
      rootMargin: '-140px 0px -60% 0px',
      threshold: [0, 1],
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-labelledby="legal-toc-title"
      className="legal-fade-up rounded-[14px] border border-white/[0.1] bg-rave-panel/70 p-4 lg:sticky lg:top-[104px]"
    >
      <h2
        id="legal-toc-title"
        className="px-2 pt-1 font-heading text-2xl font-black uppercase tracking-tight text-white"
      >
        On This Page
      </h2>
      <span
        aria-hidden
        className="mx-2 mt-2 block h-[3px] w-10 rounded-full bg-rave-red"
        style={{ boxShadow: '0 0 14px rgba(255,23,61,0.55)' }}
      />
      <ol className={`mt-4 flex flex-col ${withIcons ? 'gap-2' : 'divide-y divide-white/[0.08]'}`}>
        {items.map((item) => {
          const active = item.id === activeId;
          const Icon = withIcons ? ICONS[item.id] : undefined;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                aria-current={active ? 'location' : undefined}
                className={`flex min-h-[48px] items-center gap-3 rounded-[8px] px-3 text-base transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                  active
                    ? 'bg-rave-red font-semibold text-white'
                    : withIcons
                      ? 'border border-white/[0.12] text-white/90 hover:border-white/35 hover:text-white'
                      : 'text-white/90 hover:text-white'
                }`}
              >
                {Icon && <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.6} />}
                <span className="flex-1">{item.label}</span>
                {withIcons ? (
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
