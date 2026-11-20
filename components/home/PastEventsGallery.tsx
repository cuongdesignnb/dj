'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Images } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import { NavigationLink } from '@/components/shared/NavigationFeedback';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { HomeAlbum, HomeEventCard, HomeSectionCopy } from './types';

/** Recent past events and the photo albums from them. */
export default function PastEventsGallery({ copy, events, albums }: { copy: HomeSectionCopy; events: HomeEventCard[]; albums: HomeAlbum[] }) {
  if (events.length === 0 && albums.length === 0) return null;
  return (
    <section id="past-events" data-home-section="past" className="relative scroll-mt-24 overflow-hidden bg-rave-black py-20 md:py-28">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionTitle eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.description || undefined} align="left" />
          <div className="mb-10 flex flex-wrap gap-5 md:mb-14">
            {events.length > 0 && (
              <NavigationLink href={copy.ctaHref || '/events/past'} className="inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[0.18em] text-rave-red transition-colors hover:text-white">
                {copy.ctaLabel || 'All past events'} <ArrowRight aria-hidden className="h-4 w-4" />
              </NavigationLink>
            )}
            {albums.length > 0 && (
              <NavigationLink href="/gallery" className="inline-flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-[0.18em] text-rave-red transition-colors hover:text-white">
                Full gallery <ArrowRight aria-hidden className="h-4 w-4" />
              </NavigationLink>
            )}
          </div>
        </div>

        {events.length > 0 && (
          <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {events.map((event) => (
              <motion.li key={event.slug} variants={fadeUp}>
                <NavigationLink href={`/events/${encodeURIComponent(event.slug)}`} className="group block overflow-hidden rounded-2xl border border-white/[0.08] bg-rave-panel/60 transition-colors hover:border-rave-red/50">
                  <span className="relative block aspect-[4/5] overflow-hidden bg-rave-deep">
                    {event.poster ? (
                      <Image src={event.poster.src} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover grayscale-[35%] transition duration-500 group-hover:scale-[1.04] group-hover:grayscale-0" />
                    ) : (
                      <span aria-hidden className="absolute inset-0 grid place-items-center bg-gradient-to-br from-rave-purple/20 to-rave-red/20 p-4 text-center font-heading text-2xl font-black uppercase text-white/70">{event.title}</span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-rave-black/70 px-3 py-1 font-heading text-[10px] uppercase tracking-[0.2em] text-white/85">Past event</span>
                  </span>
                  <span className="block p-4">
                    <span className="block font-heading text-lg font-black uppercase text-white">{event.title}</span>
                    {(event.date || event.venue) && <span className="mt-1 block text-xs text-rave-muted">{[event.date, event.venue].filter(Boolean).join(' · ')}</span>}
                  </span>
                </NavigationLink>
              </motion.li>
            ))}
          </motion.ul>
        )}

        {albums.length > 0 && (
          <motion.ul variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${events.length > 0 ? 'mt-6' : ''}`}>
            {albums.map((album) => (
              <motion.li key={album.slug} variants={fadeUp}>
                <NavigationLink href={`/gallery/${encodeURIComponent(album.slug)}`} className="group relative block aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.08] bg-rave-deep">
                  {album.cover && <Image src={album.cover.src} alt={album.cover.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-rave-black/85 via-rave-black/20 to-transparent" />
                  <span className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-3 p-5">
                    <span>
                      <span className="block font-heading text-[11px] uppercase tracking-[0.22em] text-rave-red">Gallery</span>
                      <span className="block font-heading text-xl font-black uppercase text-white">{album.title}</span>
                    </span>
                    {album.count > 0 && <span className="inline-flex items-center gap-1.5 rounded-full bg-rave-black/70 px-3 py-1 text-xs text-white/85"><Images aria-hidden className="h-3.5 w-3.5" />{album.count}</span>}
                  </span>
                </NavigationLink>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </Container>
    </section>
  );
}
