'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from './SectionTitle';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { HomeAftermovie, HomeSectionCopy } from './types';

function Film({ film }: { film: HomeAftermovie }) {
  const [playing, setPlaying] = useState(false);
  const poster = film.poster ?? (film.youtubeId ? `https://i.ytimg.com/vi/${film.youtubeId}/hqdefault.jpg` : null);

  return (
    <figure className="group overflow-hidden rounded-[22px] border border-white/[0.08] bg-rave-panel/60">
      <div className="relative aspect-video bg-rave-deep">
        {playing && film.youtubeId ? (
          <iframe
            title={film.title || 'Aftermovie'}
            src={`https://www.youtube-nocookie.com/embed/${film.youtubeId}?autoplay=1&rel=0`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : playing && film.video ? (
          <video src={film.video} poster={poster ?? undefined} controls autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-contain" />
        ) : (
          // Nothing loads from YouTube until the visitor presses play.
          <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label={`Play ${film.title || 'aftermovie'}`}>
            {poster && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-rave-black/70 via-rave-black/10 to-transparent" />
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-rave-red shadow-[0_0_40px_rgb(var(--rave-accent-rgb)/0.6)] transition-transform group-hover:scale-110 md:h-20 md:w-20">
              <Play aria-hidden className="ml-1 h-7 w-7 fill-white text-white" />
            </span>
          </button>
        )}
      </div>
      {film.title && <figcaption className="px-5 py-4 font-heading text-base font-bold uppercase tracking-wide text-white">{film.title}</figcaption>}
    </figure>
  );
}

/** Event films: YouTube links or uploaded videos from Admin › Content › Homepage › Aftermovies. */
export default function Aftermovies({ copy, films }: { copy: HomeSectionCopy; films: HomeAftermovie[] }) {
  if (films.length === 0) return null;
  return (
    <section id="aftermovies" data-home-section="aftermovies" className="relative scroll-mt-24 overflow-hidden bg-rave-deep py-20 md:py-28">
      <Container>
        <SectionTitle eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.description || undefined} />
        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {films.map((film, index) => (
            <motion.div key={film.id} variants={fadeUp} className={index === 0 && films.length % 2 === 1 ? 'md:col-span-2' : ''}>
              <Film film={film} />
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
