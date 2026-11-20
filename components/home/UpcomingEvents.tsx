'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, Clock, ExternalLink, MapPin, Ticket } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { HomeEventCard, HomeSectionCopy } from './types';

/** Every upcoming published event, so visitors pick the night they want. */
export default function UpcomingEvents({ copy, events }: { copy: HomeSectionCopy; events: HomeEventCard[] }) {
  return (
    <section id="upcoming-events" data-home-section="upcoming" className="relative scroll-mt-24 overflow-hidden bg-rave-black py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-rave-grid opacity-15" />
      <Container className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.description || undefined} align="left" />
          {copy.ctaLabel && copy.ctaHref && (
            <NavigationLink href={copy.ctaHref} className="mb-10 inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[0.18em] text-rave-red transition-colors hover:text-white md:mb-14">
              {copy.ctaLabel} <ArrowRight aria-hidden className="h-4 w-4" />
            </NavigationLink>
          )}
        </div>

        {events.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            data-upcoming-empty=""
            className="rounded-[22px] border border-dashed border-white/[0.14] bg-rave-panel/40 px-6 py-14 text-center"
          >
            <p className="font-heading text-2xl font-black uppercase tracking-wide text-white">The next night is on its way</p>
            <p className="mx-auto mt-3 max-w-lg text-rave-muted">Join the newsletter to hear first when new events, lineups and tickets drop.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a href="#newsletter" className="inline-flex min-h-[46px] items-center rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-xs font-bold uppercase tracking-[0.14em] text-white">Get notified</a>
              <NavigationLink href="/events/past" className="inline-flex min-h-[46px] items-center rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white hover:border-rave-red">Past events</NavigationLink>
            </div>
          </motion.div>
        ) : (
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className={`grid grid-cols-1 gap-6 ${events.length === 1 ? 'lg:grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-3'}`}
          >
            {events.map((event) => {
              const href = `/events/${encodeURIComponent(event.slug)}`;
              const wide = events.length === 1;
              return (
                <motion.li key={event.slug} variants={fadeUp} data-upcoming-event={event.slug}>
                  <article className={`group relative flex h-full overflow-hidden rounded-[22px] border border-white/[0.08] bg-rave-panel/60 transition-colors hover:border-rave-red/50 ${wide ? 'flex-col md:flex-row' : 'flex-col'}`}>
                    <NavigationLink href={href} className={`relative block shrink-0 overflow-hidden bg-rave-deep ${wide ? 'aspect-[4/5] md:w-[42%]' : 'aspect-[4/5]'}`} aria-label={`${event.title} — event details`}>
                      {event.poster ? (
                        <>
                          <Image src={event.poster.src} alt="" aria-hidden fill sizes="(max-width: 768px) 100vw, 40vw" className="scale-110 object-cover opacity-40 blur-xl" />
                          <Image src={event.poster.src} alt={event.poster.alt || `${event.title} poster`} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-contain transition-transform duration-500 group-hover:scale-[1.03]" />
                        </>
                      ) : (
                        <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-rave-purple/25 to-rave-red/25 p-6 text-center font-heading text-4xl font-black uppercase text-white">{event.title}</span>
                      )}
                    </NavigationLink>
                    <div className={`flex flex-1 flex-col p-6 ${wide ? 'md:p-10 md:justify-center' : ''}`}>
                      {event.eyebrow && <p className="font-heading text-[11px] uppercase tracking-[0.25em] text-rave-red">{event.eyebrow}</p>}
                      <h3 className={`mt-1 font-heading font-black uppercase leading-tight text-white ${wide ? 'text-3xl md:text-5xl' : 'text-2xl'}`}>
                        <NavigationLink href={href} className="hover:text-rave-red transition-colors">{event.title}</NavigationLink>
                      </h3>
                      <ul className="mt-4 flex flex-col gap-2 text-sm text-white/85">
                        {event.date && <li className="flex items-center gap-2"><CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />{event.date}</li>}
                        {event.time && <li className="flex items-center gap-2"><Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />{event.time}</li>}
                        {event.venue && <li className="flex items-center gap-2"><MapPin aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />{event.venue}</li>}
                      </ul>
                      {event.genres.length > 0 && (
                        <p className="mt-4 flex flex-wrap gap-2">
                          {event.genres.slice(0, 4).map((genre) => <span key={genre} className="rounded-full border border-white/[0.12] px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-rave-muted">{genre}</span>)}
                        </p>
                      )}
                      <div className="mt-auto flex flex-wrap gap-3 pt-6">
                        <NavigationLink href={href} className="inline-flex min-h-[46px] items-center gap-2 rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_0_20px_rgb(var(--rave-accent-rgb)/0.35)] transition hover:brightness-110">
                          Event details <ArrowRight aria-hidden className="h-4 w-4" />
                        </NavigationLink>
                        {event.provider ? (
                          <a href={event.provider.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10">
                            <Ticket aria-hidden className="h-4 w-4" /> Tickets <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                            <span className="sr-only">(opens {event.provider.name} in a new tab)</span>
                          </a>
                        ) : (
                          <NavigationLink href={`/tickets?event=${encodeURIComponent(event.slug)}`} className="inline-flex min-h-[46px] items-center gap-2 rounded-full border border-white/[0.16] px-6 font-heading text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:border-rave-red hover:bg-rave-red/10">
                            <Ticket aria-hidden className="h-4 w-4" /> Tickets
                          </NavigationLink>
                        )}
                      </div>
                    </div>
                  </article>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </Container>
    </section>
  );
}
