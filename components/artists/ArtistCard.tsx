'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Artist } from '@/lib/artists/types';
import { artistImageReveal } from '@/lib/animations';

/**
 * One artist in the lineup grid.
 *
 * The whole card is a link to the artist's own page, built from
 * `artist.slug` — never from lower-casing the display name, which would send
 * "NICOLE CHEN" and "BI HI" to the wrong URLs.
 *
 * Tilt is kept to ±3° and only reacts to a fine pointer, so a phone never runs
 * pointer maths for eight cards at once.
 */
export default function ArtistCard({
  artist,
  priority = false,
}: {
  artist: Artist;
  priority?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [3, -3]), {
    stiffness: 120,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-3, 3]), {
    stiffness: 120,
    damping: 18,
  });

  const tiltEnabled = () =>
    !reduced && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  return (
    <motion.article variants={artistImageReveal} className="h-full">
      <motion.div
        ref={cardRef}
        initial="rest"
        animate="rest"
        whileHover={reduced ? undefined : 'hover'}
        whileFocus={reduced ? undefined : 'hover'}
        variants={{ rest: { y: 0, scale: 1 }, hover: { y: -10, scale: 1.015 } }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={reduced ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
        onMouseMove={(e) => {
          if (!tiltEnabled()) return;
          const rect = cardRef.current?.getBoundingClientRect();
          if (!rect) return;
          pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
          pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          pointerX.set(0);
          pointerY.set(0);
        }}
        className="group/card h-full"
      >
        <Link
          href={`/lineup/${artist.slug}`}
          className="flex h-full flex-col overflow-hidden rounded-[18px] border border-white/[0.08] bg-rave-panel/70 transition-[border-color,box-shadow] duration-300 hover:border-rave-red/70 hover:shadow-[0_22px_60px_rgba(255,23,61,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden">
            <motion.div
              variants={{ rest: { scale: 1 }, hover: { scale: reduced ? 1 : 1.045 } }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="absolute inset-0"
            >
              <Image
                src={artist.portrait.src}
                alt={artist.portrait.alt}
                fill
                priority={priority}
                loading={priority ? undefined : 'lazy'}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                className="object-cover"
              />
            </motion.div>

            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(3,3,5,0.10) 0%, rgba(3,3,5,0) 40%, rgba(3,3,5,0.92) 100%)',
              }}
            />

            <div className="absolute inset-x-0 bottom-0 p-4 text-center">
              <p className="font-heading text-[10px] uppercase tracking-[0.28em] text-rave-muted sm:text-[11px]">
                {artist.country}
              </p>
              <p
                className="mt-1 font-heading text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-[28px]"
                style={{ textShadow: '0 0 20px rgba(0,0,0,0.65)' }}
              >
                {artist.name}
              </p>
            </div>
          </div>

          <span className="m-4 mt-auto inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/15 bg-white/[0.02] px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-colors duration-300 group-hover/card:border-rave-red group-hover/card:bg-rave-red group-hover/card:text-white sm:text-sm">
            View Profile
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-1"
            />
          </span>
        </Link>
      </motion.div>
    </motion.article>
  );
}
