'use client';

import { useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import Container from '@/components/ui/Container';
import { artistStagger } from '@/lib/animations';
import type { Artist, ArtistCountryFilter } from '@/lib/artists/types';
import {
  ARTIST_COUNTRY_FILTERS,
  countryFilterLabel,
  matchesCountry,
} from '@/lib/artists/helpers';
import ArtistCard from './ArtistCard';

const GRID_ID = 'artist-grid';

/**
 * The lineup grid and its country filter.
 *
 * Filter state is local to this island — it is a view preference, not something
 * another section needs — while the initial value comes from the server so
 * /lineup?country=vietnam renders filtered on the first paint.
 */
export default function ArtistGrid({
  artists,
  initialFilter = 'all',
}: {
  artists: Artist[];
  initialFilter?: ArtistCountryFilter;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [filter, setFilter] = useState<ArtistCountryFilter>(initialFilter);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  // Only offer filters that actually match someone in the lineup.
  const available = useMemo(
    () =>
      ARTIST_COUNTRY_FILTERS.filter(
        (option) => option === 'all' || artists.some((artist) => artist.country === option),
      ),
    [artists],
  );

  const visible = useMemo(
    () => artists.filter((artist) => matchesCountry(artist, filter)),
    [artists, filter],
  );

  const select = (next: ArtistCountryFilter) => {
    setFilter(next);
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('country');
    else params.set('country', next.toLowerCase());
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const move = (from: number, delta: number) => {
    const next = (from + delta + available.length) % available.length;
    select(available[next]);
    buttons.current[next]?.focus();
  };

  return (
    <section
      ref={ref}
      id="artists"
      aria-labelledby="artists-title"
      className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="artists-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              Artists
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-6 sm:pb-2">
            <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:text-xs">
              Same People <span aria-hidden className="text-rave-red">&mdash;</span> Brighter Tomorrow
            </p>
            <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:text-xs">
              {artists.length} Artists
            </p>
          </div>
        </div>

        {/* Filters */}
        <div
          role="radiogroup"
          aria-label="Filter artists by country"
          aria-controls={GRID_ID}
          className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3"
        >
          {available.map((option, index) => {
            const active = option === filter;
            return (
              <button
                key={option}
                ref={(node) => {
                  buttons.current[index] = node;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => select(option)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                    event.preventDefault();
                    move(index, 1);
                  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    move(index, -1);
                  }
                }}
                className={`inline-flex min-h-[44px] items-center gap-2 rounded-[14px] border px-5 font-heading text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-sm ${
                  active
                    ? 'border-rave-red bg-rave-red text-white shadow-[0_0_20px_rgba(255,23,61,0.35)]'
                    : 'border-white/[0.12] bg-white/[0.02] text-rave-muted hover:border-white/30 hover:text-white'
                }`}
              >
                {/* A check, not just colour, marks the active filter. */}
                {active && <Check aria-hidden className="h-3.5 w-3.5" />}
                {countryFilterLabel(option)}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="sr-only">
          {visible.length === 1 ? '1 artist shown' : `${visible.length} artists shown`}
        </p>

        {visible.length > 0 ? (
          <motion.div
            id={GRID_ID}
            // Remounting on filter change replays the stagger for the new set.
            key={filter}
            variants={artistStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {visible.map((artist, index) => (
              <ArtistCard key={artist.slug} artist={artist} priority={index < 4} />
            ))}
          </motion.div>
        ) : (
          <div
            id={GRID_ID}
            className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
          >
            <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              The lineup is being prepared.
            </p>
            <p className="mt-3 text-sm text-rave-muted sm:text-base">
              Artist announcements will appear here.
            </p>
          </div>
        )}
      </Container>
    </section>
  );
}
