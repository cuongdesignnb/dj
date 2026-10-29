'use client';

import { ExternalLink, Globe, Mail } from 'lucide-react';
import Container from '@/components/ui/Container';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import RichText from '@/components/shared/RichText';
import type { EventPageData } from '@/lib/events/types';

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/** Who runs the night, with their own channels. Shown once Admin › Event Page Content › Organiser has a name. */
export default function EventOrganiser({ event }: { event: EventPageData }) {
  const organiser = event.event.organiser;
  if (!organiser) return null;
  const links = [
    organiser.website ? { label: hostOf(organiser.website), href: organiser.website, Icon: Globe } : null,
    organiser.instagram ? { label: 'Instagram', href: organiser.instagram, Icon: ExternalLink } : null,
    organiser.facebook ? { label: 'Facebook', href: organiser.facebook, Icon: ExternalLink } : null,
  ].filter((link): link is NonNullable<typeof link> => link !== null);
  const initials = organiser.name.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section id="organiser" aria-labelledby="organiser-title" className="relative py-16 md:py-20 bg-rave-deep">
      <Container>
        <div data-event-organiser="" className="flex flex-col gap-6 rounded-[22px] border border-white/[0.08] bg-rave-panel/60 p-6 sm:p-8 md:flex-row md:items-center">
          <span aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-rave-red/40 bg-rave-red/10 font-heading text-2xl font-black text-rave-red">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[11px] uppercase tracking-[0.25em] text-rave-red">Organiser</p>
            <h2 id="organiser-title" className="mt-1 font-heading text-2xl font-black uppercase text-white sm:text-3xl">{organiser.name}</h2>
            {organiser.description && (
              <div className="mt-2 max-w-2xl text-sm leading-relaxed text-rave-muted">
                <RichText text={organiser.description} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map(({ label, href, Icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/[0.14] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10">
                  <Icon aria-hidden className="h-4 w-4" /> {label}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ))}
              <NavigationLink href="/contact" className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-white/[0.14] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10">
                <Mail aria-hidden className="h-4 w-4" /> Contact the organiser
              </NavigationLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
