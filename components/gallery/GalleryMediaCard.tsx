'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Expand, Music2, Play, MapPin, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { GalleryMediaItem } from '@/lib/gallery/types';
import { categoryLabel, isPlayable } from '@/lib/gallery/helpers';
import { galleryImageReveal } from '@/lib/animations';

const CATEGORY_ICONS: Partial<Record<GalleryMediaItem['category'], LucideIcon>> = {
  crowd: Users,
  artists: Music2,
  venue: MapPin,
};

/**
 * One tile in the gallery.
 *
 * The whole tile is a button, so it is reachable and operable from the
 * keyboard. A play affordance appears only when a clip actually exists —
 * a video-typed slot with no source shows the expand control instead, so
 * nothing promises playback it cannot deliver.
 */
export default function GalleryMediaCard({
  item,
  onOpen,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
}: {
  item: GalleryMediaItem;
  onOpen(item: GalleryMediaItem): void;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const reduced = useReducedMotion();
  const playable = isPlayable(item);
  const Icon = CATEGORY_ICONS[item.category];
  const label = playable
    ? `Play ${item.title ?? 'video'}`
    : `Open ${item.title ?? categoryLabel(item.category)} in the media viewer`;

  return (
    <motion.button
      type="button"
      variants={galleryImageReveal}
      initial="rest"
      whileHover={reduced ? undefined : 'hover'}
      whileFocus={reduced ? undefined : 'hover'}
      animate="rest"
      onClick={() => onOpen(item)}
      aria-label={label}
      className={`group/tile relative block w-full overflow-hidden rounded-[16px] border border-white/[0.08] transition-[border-color,box-shadow] duration-300 hover:border-rave-red/60 hover:shadow-[0_20px_50px_rgba(255,23,61,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black ${className}`}
    >
      <motion.span
        variants={{ rest: { scale: 1 }, hover: { scale: reduced ? 1 : 1.035 } }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute inset-0 block"
      >
        <Image
          src={item.thumbnail.src}
          alt={item.thumbnail.alt}
          fill
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          sizes={sizes}
          className="object-cover"
        />
      </motion.span>

      <span
        aria-hidden
        className="absolute inset-0 transition-opacity duration-300 group-hover/tile:opacity-90"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,3,5,0.05) 0%, rgba(3,3,5,0) 45%, rgba(3,3,5,0.85) 100%)',
        }}
      />

      {playable && (
        <span
          aria-hidden
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/40 bg-black/50 text-white backdrop-blur-sm transition-transform duration-300 group-hover/tile:scale-110">
            <Play className="ml-0.5 h-6 w-6" />
          </span>
        </span>
      )}

      {/* Category is text, not only an icon or a colour. */}
      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 font-heading text-[10px] uppercase tracking-[0.18em] text-white sm:text-xs">
        {Icon && <Icon aria-hidden className="h-3.5 w-3.5 text-rave-red" />}
        {categoryLabel(item.category)}
      </span>

      <span
        aria-hidden
        className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-lg border border-white/25 bg-black/55 text-white transition-transform duration-300 group-hover/tile:scale-110"
      >
        <Expand className="h-3.5 w-3.5" />
      </span>
    </motion.button>
  );
}
