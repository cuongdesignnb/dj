'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Container from '@/components/ui/Container';
import { galleryReveal, galleryStagger } from '@/lib/animations';
import type { GalleryCollection } from '@/lib/gallery/types';
import { statusLabel } from '@/lib/gallery/helpers';

/**
 * Other collections to browse.
 *
 * Renders nothing when there are none. The reference design shows further
 * albums ("Artist Moments", "Venue / Production", "Crowd Energy"), but nothing
 * confirms those exist — inventing slugs for them would present albums that
 * cannot be opened as if they were real.
 */
export default function RelatedCollections({
  collections,
}: {
  collections: GalleryCollection[];
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();

  if (collections.length === 0) return null;

  return (
    <section
      ref={ref}
      aria-labelledby="more-collections-title"
      className="relative bg-rave-deep py-16 md:py-24"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-rave-grid opacity-[0.07]" />

      <Container className="relative z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="more-collections-title"
              className="font-heading text-3xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-4xl md:text-[42px]"
            >
              More Collections
            </h2>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-20 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red sm:w-24"
              style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55)' }}
            />
          </div>
          <p className="font-heading text-[11px] uppercase tracking-[0.26em] text-rave-muted sm:pb-2 sm:text-xs">
            Explore More <span aria-hidden className="text-rave-red">&times;</span> Connection Rave
          </p>
        </div>

        <motion.ul
          variants={galleryStagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {collections.map((collection) => (
            <motion.li key={collection.slug} variants={galleryReveal}>
              <Link
                href={`/gallery/${collection.slug}`}
                className="group/card relative block aspect-[16/10] overflow-hidden rounded-[16px] border border-white/[0.08] transition-[border-color,box-shadow] duration-300 hover:border-rave-red/60 hover:shadow-[0_20px_50px_rgba(255,23,61,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
              >
                <motion.span
                  variants={{ rest: { scale: 1 }, hover: { scale: reduced ? 1 : 1.04 } }}
                  initial="rest"
                  whileHover="hover"
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 block"
                >
                  <Image
                    src={collection.cover.src}
                    alt={collection.cover.alt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                </motion.span>

                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(3,3,5,0.1) 0%, rgba(3,3,5,0) 40%, rgba(3,3,5,0.9) 100%)',
                  }}
                />

                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block font-heading text-lg font-black uppercase leading-none tracking-tight text-white sm:text-xl">
                    {collection.title}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1.5 font-heading text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {statusLabel(collection)}
                    <ArrowRight
                      aria-hidden
                      className="h-3 w-3 transition-transform duration-300 group-hover/card:translate-x-1"
                    />
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
