'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowLeft, Check, Expand, Images, Layers, Play } from 'lucide-react';
import Container from '@/components/ui/Container';
import { galleryImageReveal, galleryReveal, galleryStagger } from '@/lib/animations';
import type { CollectionMediaFilter, GalleryCollection, GalleryMediaItem } from '@/lib/gallery/types';
import {
  countPhotos,
  countVideos,
  featuredMedia,
  isPlayable,
  matchesMediaType,
  mediaSectionTitle,
  sortMedia,
  statusLabel,
  videoHighlight,
} from '@/lib/gallery/helpers';
import GalleryMediaCard from './GalleryMediaCard';
import GalleryLightbox from './GalleryLightbox';
import GalleryVideoModal from './GalleryVideoModal';

const GRID_ID = 'collection-media-grid';

const FILTERS: Array<{ value: CollectionMediaFilter; label: string }> = [
  { value: 'all', label: 'All Media' },
  { value: 'photo', label: 'Photos' },
  { value: 'video', label: 'Videos' },
];

function Heading({
  title,
  titleId,
  context,
}: {
  title: string;
  titleId: string;
  context?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2
          id={titleId}
          className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
        >
          {title}
        </h2>
        <span
          aria-hidden
          className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
        />
      </div>
      {context && (
        <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
          {context}
        </p>
      )}
    </div>
  );
}

/**
 * Everything interactive on a collection page: the media-type filter, the
 * featured item, the grid, the video highlight and the viewers they open.
 *
 * As on the listing, changing the filter closes any open viewer rather than
 * leaving it pointing at an item the list no longer shows.
 */
export default function CollectionView({ collection }: { collection: GalleryCollection }) {
  const albumRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLElement>(null);
  const albumInView = useInView(albumRef, { once: true, margin: '-80px' });
  const gridInView = useInView(gridRef, { once: true, margin: '-80px' });

  const [filter, setFilter] = useState<CollectionMediaFilter>('all');
  const [lightboxId, setLightboxId] = useState<string | null>(null);
  const [videoItem, setVideoItem] = useState<GalleryMediaItem | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const sorted = useMemo(() => sortMedia(collection.media), [collection.media]);
  const visible = useMemo(
    () => sorted.filter((item) => matchesMediaType(item, filter)),
    [sorted, filter],
  );
  const lightboxItems = useMemo(() => visible.filter((item) => item.type === 'photo'), [visible]);
  const lightboxIndex = lightboxId
    ? lightboxItems.findIndex((item) => item.id === lightboxId)
    : -1;

  const featured = featuredMedia(collection);
  const highlight = videoHighlight(collection);
  const photos = countPhotos(collection);
  const videos = countVideos(collection);

  const openMedia = useCallback((item: GalleryMediaItem) => {
    if (item.type === 'video') setVideoItem(item);
    else setLightboxId(item.id);
  }, []);

  const selectFilter = (next: CollectionMediaFilter) => {
    setFilter(next);
    setLightboxId(null);
    setVideoItem(null);
  };

  const move = (from: number, delta: number) => {
    const next = (from + delta + FILTERS.length) % FILTERS.length;
    selectFilter(FILTERS[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <>
      {/* Album: featured media + about */}
      <section
        ref={albumRef}
        id="album"
        aria-labelledby="album-title"
        className="relative scroll-mt-[100px] bg-rave-black py-16 md:py-24"
      >
        <Container>
          <Heading
            title="Album"
            titleId="album-title"
            context={`${collection.title} // ${statusLabel(collection)}`}
          />

          <div
            role="radiogroup"
            aria-label="Filter media type"
            aria-controls={GRID_ID}
            className="mt-8 flex flex-wrap items-center gap-2.5 sm:gap-3"
          >
            {FILTERS.map((option, index) => {
              const active = option.value === filter;
              return (
                <button
                  key={option.value}
                  ref={(node) => {
                    buttons.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  onClick={() => selectFilter(option.value)}
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
                  {option.label}
                </button>
              );
            })}
          </div>

          <motion.div
            variants={galleryStagger}
            initial="hidden"
            animate={albumInView ? 'visible' : 'hidden'}
            className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8"
          >
            {/* Featured media */}
            {featured && (
              <motion.div variants={galleryImageReveal} className="relative">
                <GalleryMediaCard
                  item={featured}
                  onOpen={openMedia}
                  priority
                  className="aspect-[16/10] w-full"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="pointer-events-none absolute bottom-3 left-3 max-w-[70%]">
                  <p className="font-heading text-lg font-black uppercase leading-none tracking-tight text-white sm:text-2xl">
                    {featured.title ?? collection.title}
                  </p>
                  {featured.caption && (
                    <p className="mt-1 font-heading text-[10px] uppercase tracking-[0.24em] text-white/70">
                      {featured.caption}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* About this collection */}
            <motion.aside
              variants={galleryReveal}
              aria-labelledby="about-collection-title"
              className="rounded-[18px] border border-white/[0.08] bg-rave-panel/80 p-5 sm:p-6"
            >
              <h3
                id="about-collection-title"
                className="font-heading text-xl font-black uppercase tracking-tight text-white sm:text-2xl"
              >
                About This Collection
              </h3>
              <span
                aria-hidden
                className="mt-3 block h-[3px] w-14 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
                style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
              />

              {collection.description && (
                <p className="mt-5 text-sm leading-relaxed text-rave-muted">
                  {collection.description}
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-rave-muted">
                Media on this page can later be connected to a CMS for future updates.
              </p>

              <dl className="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <Images aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Media
                  </dt>
                  <dd className="text-right text-white">
                    {photos} {photos === 1 ? 'photo' : 'photos'}
                    {videos > 0 ? ` + ${videos} video` : ''}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="flex items-center gap-2 text-rave-muted">
                    <Layers aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    Status
                  </dt>
                  <dd className="text-right text-white">{statusLabel(collection)}</dd>
                </div>
              </dl>

              <Link
                href="/gallery"
                className="group/back mt-6 inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/15 bg-white/[0.02] px-5 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
              >
                <ArrowLeft
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover/back:-translate-x-1"
                />
                Back to Gallery
              </Link>
            </motion.aside>
          </motion.div>
        </Container>
      </section>

      {/* Media grid */}
      <section
        ref={gridRef}
        aria-labelledby="collection-media-title"
        className="relative bg-rave-black pb-16 md:pb-24"
      >
        <Container>
          <Heading
            // A preview collection is never titled as if it documented a night
            // that happened — that wording waits for a published collection.
            title={mediaSectionTitle(collection)}
            titleId="collection-media-title"
            context="People × Music × Culture × A Brighter Tomorrow"
          />

          <p aria-live="polite" className="sr-only">
            {visible.length === 1 ? '1 item shown' : `${visible.length} items shown`}
          </p>

          {visible.length > 0 ? (
            <motion.div
              id={GRID_ID}
              key={filter}
              variants={galleryStagger}
              initial="hidden"
              animate={gridInView ? 'visible' : 'hidden'}
              className="mt-8 grid auto-rows-[minmax(0,200px)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((item, position) => (
                <GalleryMediaCard
                  key={item.id}
                  item={item}
                  onOpen={openMedia}
                  className={position % 5 === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/3]'}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ))}
            </motion.div>
          ) : (
            <div
              id={GRID_ID}
              className="mt-8 rounded-[18px] border border-white/[0.08] bg-rave-panel/60 px-6 py-14 text-center"
            >
              <p className="font-heading text-xl uppercase tracking-[0.12em] text-white sm:text-2xl">
                Media for this collection is coming soon.
              </p>
            </div>
          )}
        </Container>
      </section>

      {/* Video highlight */}
      {highlight && (
        <section
          aria-labelledby="video-highlight-title"
          className="relative bg-rave-black pb-16 md:pb-24"
        >
          <Container>
            <Heading
              title="Video Highlight"
              titleId="video-highlight-title"
              context="Press Play × Feel The Connection"
            />

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
              <div className="relative">
                <GalleryMediaCard
                  item={highlight}
                  onOpen={openMedia}
                  className="aspect-[16/9] w-full"
                  sizes="(max-width: 1024px) 100vw, 65vw"
                />
                <div className="pointer-events-none absolute bottom-3 left-3">
                  <p className="font-heading text-lg font-black uppercase leading-none tracking-tight text-white sm:text-xl">
                    {highlight.title ?? collection.title}
                  </p>
                  {highlight.caption && (
                    <p className="mt-1 font-heading text-[10px] uppercase tracking-[0.24em] text-white/70">
                      {highlight.caption}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3">
                <p className="text-sm leading-relaxed text-rave-muted">
                  A short video highlight from the {collection.title} visual collection. Video
                  content can be updated via CMS in the future.
                </p>
                {!isPlayable(highlight) && (
                  <p className="inline-flex items-center gap-2 font-heading text-[11px] uppercase tracking-[0.18em] text-rave-muted/80">
                    <Play aria-hidden className="h-3.5 w-3.5 text-rave-red" />
                    Video coming soon
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => openMedia(highlight)}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-[12px] border border-white/15 bg-white/[0.02] px-4 py-3 font-heading text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:border-rave-red/60 hover:bg-rave-red/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
                >
                  <Expand aria-hidden className="h-3.5 w-3.5" />
                  {isPlayable(highlight) ? 'Play highlight' : 'View details'}
                </button>
              </div>
            </div>
          </Container>
        </section>
      )}

      <GalleryLightbox
        items={lightboxItems}
        index={lightboxIndex >= 0 ? lightboxIndex : null}
        onClose={() => setLightboxId(null)}
        onNavigate={(next) => setLightboxId(lightboxItems[next]?.id ?? null)}
      />
      <GalleryVideoModal item={videoItem} onClose={() => setVideoItem(null)} />
    </>
  );
}
