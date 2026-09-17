'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, CalendarDays, Clock, MapPin, Music2, Ticket } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventsBreadcrumb from '@/components/events/EventsBreadcrumb';
import { artistImageReveal, artistReveal, artistStagger } from '@/lib/animations';
import type { Artist } from '@/lib/artists/types';
import { artistBioFallback, setTimeLabel } from '@/lib/artists/helpers';
import ArtistCard from './ArtistCard';
import ArtistMediaLinks from './ArtistMediaLinks';

function SectionHeading({ title, titleId }: { title: string; titleId: string }) {
  return (
    <div>
      <h2
        id={titleId}
        className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl"
      >
        {title}
      </h2>
      <span
        aria-hidden
        className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
        style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
      />
    </div>
  );
}

export default function ArtistProfile({
  artist,
  related,
}: {
  artist: Artist;
  related: Artist[];
}) {
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-60px' });
  const reduced = useReducedMotion();

  const hasBio = typeof artist.bio === 'string' && artist.bio.trim().length > 0;
  const primaryEvent = artist.upcomingEvents[0] ?? null;

  return (
    <>
      <EventsBreadcrumb
        trail={[
          { label: 'Home', href: '/' },
          { label: 'Lineup', href: '/lineup' },
          { label: artist.name },
        ]}
      />

      {/* Hero — portrait left, identity right */}
      <section
        ref={heroRef}
        aria-labelledby="artist-hero-title"
        className="relative isolate overflow-hidden bg-rave-black pb-16 pt-6 md:pb-24 md:pt-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-rave-grid opacity-[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 20% 22%, rgba(255,23,61,0.18), transparent 58%), radial-gradient(circle at 88% 78%, rgba(139,44,255,0.10), transparent 62%)',
          }}
        />

        <Container>
          <motion.div
            variants={artistStagger}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14"
          >
            {/* Portrait */}
            <motion.div
              variants={artistImageReveal}
              className="relative aspect-[4/5] overflow-hidden rounded-[20px] border border-rave-red/25 shadow-[0_30px_80px_rgba(255,23,61,0.22)] sm:aspect-[5/4] lg:aspect-[4/5]"
            >
              <Image
                src={(artist.heroImage ?? artist.portrait).src}
                alt={(artist.heroImage ?? artist.portrait).alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover object-top"
              />
              {/* Light only at the edges — never across the artist's face. */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(3,3,5,0.35) 0%, rgba(3,3,5,0) 28%, rgba(3,3,5,0) 62%, rgba(3,3,5,0.75) 100%)',
                }}
              />
              <div
                aria-hidden
                className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2 rounded-l-xl bg-gradient-to-l from-black/70 to-transparent py-3 pl-6 pr-2 text-right font-heading text-[10px] uppercase tracking-[0.22em] text-white/85 sm:text-xs"
                style={{ textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}
              >
                <span>Music</span>
                <span>Energy</span>
                <span>Connection</span>
              </div>
            </motion.div>

            {/* Identity */}
            <div>
              <motion.span
                variants={artistReveal}
                className="font-heading text-xs font-semibold uppercase tracking-[0.28em] text-rave-red sm:text-sm"
              >
                Artist Profile
              </motion.span>

              <motion.p
                variants={artistReveal}
                className="mt-5 font-heading text-sm uppercase tracking-[0.3em] text-rave-muted"
              >
                {artist.country}
              </motion.p>

              <motion.h1
                id="artist-hero-title"
                variants={artistReveal}
                className="mt-2 font-heading text-5xl font-black uppercase leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl"
              >
                {artist.name}
              </motion.h1>

              {artist.year && (
                <motion.p
                  variants={artistReveal}
                  className="mt-3 font-heading text-lg uppercase tracking-[0.34em] text-rave-muted"
                >
                  {artist.year}
                </motion.p>
              )}

              <motion.ul variants={artistStagger} className="mt-7 flex flex-wrap gap-3">
                <motion.li
                  variants={artistReveal}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-sm text-rave-muted"
                >
                  <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                  Set time {setTimeLabel(artist).toLowerCase()}
                </motion.li>
                <motion.li
                  variants={artistReveal}
                  className="inline-flex items-center gap-2 rounded-[14px] border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 text-sm text-rave-muted"
                >
                  <Music2 aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                  Artist profile
                </motion.li>
              </motion.ul>

              <motion.div variants={artistReveal} className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/tickets"
                  className="group/cta inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                >
                  Get Tickets
                  <ArrowRight
                    aria-hidden
                    className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                  />
                </Link>
                <Link
                  href="/lineup"
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.02] px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
                >
                  Back to Lineup
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* About + set */}
      <section
        aria-labelledby="artist-about-title"
        className="relative bg-rave-black py-16 md:py-24"
      >
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
            <div>
              <SectionHeading title={`About ${artist.name}`} titleId="artist-about-title" />
              <motion.p
                variants={artistReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                className="mt-6 max-w-2xl text-base leading-relaxed text-rave-muted"
              >
                {/* No biography has been supplied, so this says so rather than
                    inventing a career, a genre or a list of achievements. */}
                {hasBio ? artist.bio : artistBioFallback()}
              </motion.p>

              {artist.genres.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {artist.genres.map((genre) => (
                    <li
                      key={genre}
                      className="rounded-lg border border-white/[0.12] bg-white/[0.03] px-3.5 py-1.5 font-heading text-xs uppercase tracking-[0.14em] text-rave-muted"
                    >
                      {genre}
                    </li>
                  ))}
                </ul>
              )}

              <ArtistMediaLinks artist={artist} />
            </div>

            {/* Set details */}
            {primaryEvent && (
              <aside
                aria-labelledby="artist-set-title"
                className="rounded-[20px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6"
              >
                <h2
                  id="artist-set-title"
                  className="font-heading text-2xl font-black uppercase tracking-tight text-white sm:text-[26px]"
                >
                  Event Set
                </h2>
                <span
                  aria-hidden
                  className="mt-3 block h-[3px] w-16 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                  style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
                />

                <dl className="mt-5 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <Ticket aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Event
                    </dt>
                    <dd className="font-heading uppercase tracking-wide text-white">
                      {primaryEvent.eventTitle}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <MapPin aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Location
                    </dt>
                    <dd className="text-right text-white">{primaryEvent.venue ?? 'To be confirmed'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <Clock aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Set Time
                    </dt>
                    <dd className="text-right text-white">{setTimeLabel(artist)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-rave-muted">
                      <CalendarDays aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                      Schedule
                    </dt>
                    <dd className="text-right text-white">
                      {primaryEvent.scheduleStatus === 'confirmed' && primaryEvent.schedule
                        ? primaryEvent.schedule
                        : 'To be confirmed'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href={primaryEvent.href}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-5 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                  >
                    View Event
                  </Link>
                  <Link
                    href="/tickets"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.02] px-5 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                  >
                    Get Tickets
                  </Link>
                </div>
              </aside>
            )}
          </div>
        </Container>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section
          aria-labelledby="related-artists-title"
          className="relative bg-rave-deep py-16 md:py-24"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-rave-grid opacity-[0.07]" />
          <Container className="relative z-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeading title="More From The Lineup" titleId="related-artists-title" />
              <Link
                href="/lineup"
                className="group/link inline-flex items-center gap-2 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-sm md:pb-2"
              >
                View Full Lineup
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover/link:translate-x-1"
                />
              </Link>
            </div>

            <motion.div
              variants={artistStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {related.map((other) => (
                <ArtistCard key={other.slug} artist={other} />
              ))}
            </motion.div>
          </Container>
        </section>
      )}

      {/* Final CTA */}
      <section
        aria-labelledby="artist-cta-title"
        className="relative isolate overflow-hidden bg-rave-black py-20 md:py-28"
      >
        <Container>
          <motion.div
            variants={artistStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12"
          >
            <motion.h2
              variants={artistReveal}
              id="artist-cta-title"
              className="font-heading text-3xl font-black uppercase leading-[1.03] tracking-tight text-white sm:text-4xl md:text-5xl"
            >
              See Them At The Event
            </motion.h2>

            <motion.div
              variants={artistReveal}
              className="flex flex-wrap items-center gap-3 lg:justify-end"
            >
              <Link
                href="/tickets"
                className="group/cta inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
              >
                Get Tickets
                <ArrowRight
                  aria-hidden
                  className={`h-4 w-4 transition-transform ${reduced ? '' : 'group-hover/cta:translate-x-1'}`}
                />
              </Link>
              <Link
                href="/lineup"
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.02] px-6 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-base"
              >
                View Full Lineup
              </Link>
            </motion.div>
          </motion.div>
        </Container>
      </section>
    </>
  );
}
