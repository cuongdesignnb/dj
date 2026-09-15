'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, CalendarRange, Images, Layers } from 'lucide-react';
import Container from '@/components/ui/Container';
import { galleryImageReveal, galleryReveal, galleryStagger } from '@/lib/animations';
import type { GalleryCollection } from '@/lib/gallery/types';
import { categoryLabel, countPhotos, statusLabel } from '@/lib/gallery/helpers';

export default function FeaturedCollection({
  collection,
}: {
  collection: GalleryCollection | null | undefined;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  if (!collection) return null;

  // Counts come from the media array, never from a hardcoded number that could
  // drift away from what the collection actually holds.
  const photos = countPhotos(collection);
  const categories = collection.categories
    .filter((category) => category !== 'video')
    .map(categoryLabel)
    .join(', ');

  return (
    <section
      ref={ref}
      aria-labelledby="featured-collection-title"
      className="relative bg-rave-black py-16 md:py-24"
    >
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="featured-collection-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              Featured Collection
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
            Music <span aria-hidden className="text-rave-red">&times;</span> People{' '}
            <span aria-hidden className="text-rave-red">&times;</span> Culture{' '}
            <span aria-hidden className="text-rave-red">&times;</span> A Brighter Tomorrow
          </p>
        </div>

        <motion.div
          variants={galleryStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 overflow-hidden rounded-[20px] border border-rave-red/25 bg-rave-panel/70 p-5 sm:p-6"
        >
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,340px)_1fr_minmax(0,240px)] lg:gap-10">
            {/* Cover */}
            <motion.div
              variants={galleryImageReveal}
              className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-white/[0.10]"
            >
              <Image
                src={collection.cover.src}
                alt={collection.cover.alt}
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 340px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(3,3,5,0.2) 0%, rgba(3,3,5,0) 45%, rgba(3,3,5,0.85) 100%)',
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                <p className="font-heading text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl">
                  {collection.title}
                </p>
                <p className="mt-1.5 font-heading text-[9px] uppercase tracking-[0.3em] text-white/70 sm:text-[10px]">
                  {statusLabel(collection)}
                </p>
              </div>
            </motion.div>

            {/* Copy */}
            <div>
              <motion.p
                variants={galleryReveal}
                className="font-heading text-[11px] uppercase tracking-[0.28em] text-rave-red sm:text-xs"
              >
                Featured Album
              </motion.p>
              <motion.h3
                variants={galleryReveal}
                className="mt-3 font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight text-white sm:text-5xl"
              >
                {collection.title}
              </motion.h3>
              {collection.subtitle && (
                <motion.p
                  variants={galleryReveal}
                  className="mt-2 font-heading text-sm uppercase tracking-[0.3em] text-rave-muted"
                >
                  {statusLabel(collection)}
                </motion.p>
              )}
              {collection.description && (
                <motion.p
                  variants={galleryReveal}
                  className="mt-5 max-w-xl text-sm leading-relaxed text-rave-muted sm:text-base"
                >
                  {collection.description}
                </motion.p>
              )}
            </div>

            {/* Stats */}
            <motion.div variants={galleryReveal} className="flex flex-col gap-4">
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Photos</dt>
                  <Images aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                  <dd className="text-white">
                    {photos} {photos === 1 ? 'Photo' : 'Photos'}
                  </dd>
                </div>
                {categories && (
                  <div className="flex items-center gap-2.5">
                    <dt className="sr-only">Categories</dt>
                    <Layers aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                    <dd className="text-white">{categories}</dd>
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <dt className="sr-only">Status</dt>
                  <CalendarRange aria-hidden className="h-4 w-4 shrink-0 text-rave-red" />
                  <dd className="text-white">{statusLabel(collection)}</dd>
                </div>
              </dl>

              <Link
                href={`/gallery/${collection.slug}`}
                className="group/cta inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-rave-red to-rave-red2 px-5 py-3.5 font-heading text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_22px_rgba(255,23,61,0.35)] transition-all duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
              >
                Open Collection
                <ArrowRight
                  aria-hidden
                  className="h-4 w-4 transition-transform group-hover/cta:translate-x-1"
                />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
