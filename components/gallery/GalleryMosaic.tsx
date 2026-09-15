'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Check } from 'lucide-react';
import Container from '@/components/ui/Container';
import { galleryStagger } from '@/lib/animations';
import type { GalleryCategoryFilter, GalleryMediaItem } from '@/lib/gallery/types';
import {
  availableCategories,
  categoryLabel,
  matchesCategory,
  sortMedia,
} from '@/lib/gallery/helpers';
import GalleryMediaCard from './GalleryMediaCard';
import GalleryLightbox from './GalleryLightbox';
import GalleryVideoModal from './GalleryVideoModal';

const GRID_ID = 'gallery-grid';

/**
 * The gallery grid, its category filter and the viewers they open.
 *
 * Tile sizes vary by position so the grid reads as an editorial mosaic rather
 * than a product listing. Viewer state lives here because the filter can change
 * underneath it: if the open item leaves the filtered set, the viewer closes
 * instead of showing something the list no longer contains.
 */
export default function GalleryMosaic({
  media,
  initialFilter = 'all',
  previewNote,
}: {
  media: GalleryMediaItem[];
  initialFilter?: GalleryCategoryFilter;
  /** Short disclaimer shown beside the heading, e.g. the preview status. */
  previewNote?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [filter, setFilter] = useState<GalleryCategoryFilter>(initialFilter);
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [videoItem, setVideoItem] = useState<GalleryMediaItem | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const sorted = useMemo(() => sortMedia(media), [media]);
  const options = useMemo(() => availableCategories(sorted), [sorted]);
  const visible = useMemo(
    () => sorted.filter((item) => matchesCategory(item, filter)),
    [sorted, filter],
  );

  // Photos are what the lightbox can page through.
  const lightboxItems = useMemo(() => visible.filter((item) => item.type === 'photo'), [visible]);
  const lightboxIndex = lightboxId
    ? lightboxItems.findIndex((item) => item.id === lightboxId)
    : -1;

  const selectFilter = (next: GalleryCategoryFilter) => {
    setFilter(next);
    // The open item may not survive the new filter, so close rather than
    // leave the viewer pointing at something that is no longer listed.
    setLightboxId(null);
    setVideoItem(null);

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (next === 'all') params.delete('category');
    else params.set('category', next);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  };

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    selectFilter(options[next]);
    buttons.current[next]?.focus();
  };

  const openMedia = useCallback((item: GalleryMediaItem) => {
    if (item.type === 'video') setVideoItem(item);
    else setLightboxId(item.id);
  }, []);

  // Mosaic emphasis: first tile wide and tall, fourth tile wide.
  const tileClass = (position: number) => {
    if (position === 0) return 'sm:col-span-2 sm:row-span-2 aspect-[4/3] sm:aspect-auto';
    if (position === 3) return 'sm:col-span-2 aspect-[4/3] sm:aspect-[16/9]';
    return 'aspect-[4/3]';
  };

  return (
    <section
      ref={ref}
      id="gallery"
      aria-labelledby="gallery-title"
      className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="gallery-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              Gallery
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
            Gallery Preview <span aria-hidden className="text-rave-red">&mdash;</span> Moments That
            Inspire
          </p>
        </div>

        {/* Filters + disclaimer */}
        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="radiogroup"
            aria-label="Filter gallery by category"
            aria-controls={GRID_ID}
            className="flex flex-wrap items-center gap-2.5 sm:gap-3"
          >
            {options.map((option, index) => {
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
                  onClick={() => selectFilter(option)}
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
                  {active && <Check aria-hidden className="h-3.5 w-3.5" />}
                  {option === 'all' ? 'All' : categoryLabel(option)}
                </button>
              );
            })}
          </div>

          {previewNote && (
            <p className="font-heading text-[11px] uppercase tracking-[0.2em] text-rave-muted sm:text-xs">
              {previewNote}
            </p>
          )}
        </div>

        <p aria-live="polite" className="sr-only">
          {visible.length === 1 ? '1 item shown' : `${visible.length} items shown`}
        </p>

        {visible.length > 0 ? (
          <motion.div
            id={GRID_ID}
            key={filter}
            variants={galleryStagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            className="mt-8 grid auto-rows-[minmax(0,220px)] grid-cols-1 gap-4 sm:grid-cols-3 sm:auto-rows-[minmax(0,180px)] lg:auto-rows-[minmax(0,220px)]"
          >
            {visible.map((item, position) => (
              <GalleryMediaCard
                key={item.id}
                item={item}
                onOpen={openMedia}
                priority={position === 0}
                className={tileClass(position)}
                sizes={
                  position === 0
                    ? '(max-width: 640px) 100vw, 60vw'
                    : '(max-width: 640px) 100vw, 30vw'
                }
              />
            ))}
          </motion.div>
        ) : (
          <div
            id={GRID_ID}
            className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
          >
            <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
              The gallery is being prepared.
            </p>
            <p className="mt-3 text-sm text-rave-muted sm:text-base">
              Visual collections will appear here.
            </p>
          </div>
        )}
      </Container>

      <GalleryLightbox
        items={lightboxItems}
        index={lightboxIndex >= 0 ? lightboxIndex : null}
        onClose={() => setLightboxId(null)}
        onNavigate={(next) => setLightboxId(lightboxItems[next]?.id ?? null)}
      />
      <GalleryVideoModal item={videoItem} onClose={() => setVideoItem(null)} />
    </section>
  );
}
