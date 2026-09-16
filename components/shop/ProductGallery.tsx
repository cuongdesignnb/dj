'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';
import { productImageSwap, shopReveal, shopStagger } from '@/lib/animations';
import type { ProductImage } from '@/lib/shop/types';

/**
 * Primary image with thumbnails. Choosing a thumbnail swaps the image in
 * place — no navigation — and the zoom button opens a native modal dialog,
 * which brings focus containment, Escape and focus return with it.
 */
export default function ProductGallery({
  images,
  productTitle,
}: {
  images: ProductImage[];
  productTitle: string;
}) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activeId, setActiveId] = useState(images[0]?.id ?? null);
  const active = images.find((image) => image.id === activeId) ?? images[0];

  if (!active) {
    return (
      <div className="grid aspect-square place-items-center rounded-[20px] border border-white/[0.08] bg-rave-panel text-sm text-rave-muted">
        Product imagery is being prepared.
      </div>
    );
  }

  const openZoom = () => dialogRef.current?.showModal();
  const closeZoom = () => dialogRef.current?.close();

  return (
    <motion.div
      variants={shopStagger}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-3 lg:sticky lg:top-[104px] lg:flex-row"
    >
      <motion.div
        variants={shopReveal}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-white/[0.08] bg-rave-deep lg:flex-1"
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={active.id}
            variants={reduced ? undefined : productImageSwap}
            initial={reduced ? { opacity: 0 } : 'enter'}
            animate={reduced ? { opacity: 1 } : 'center'}
            exit={reduced ? { opacity: 0 } : 'exit'}
            className="absolute inset-0"
          >
            <Image
              src={active.image.src}
              alt={active.image.alt}
              fill
              priority={active.id === images[0].id}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={openZoom}
          aria-label={`Enlarge image: ${active.label ?? productTitle}`}
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red motion-reduce:hover:scale-100"
        >
          <ZoomIn aria-hidden className="h-5 w-5" />
        </button>
      </motion.div>

      {images.length > 1 && (
        <motion.ul
          variants={shopStagger}
          aria-label={`${productTitle} images`}
          className="grid grid-cols-4 gap-3 lg:w-[112px] lg:grid-cols-1 lg:content-start"
        >
          {images.map((image, index) => {
            const selected = image.id === active.id;
            return (
              <motion.li key={image.id} variants={shopReveal}>
                <button
                  type="button"
                  onClick={() => setActiveId(image.id)}
                  aria-pressed={selected}
                  aria-label={`Show ${image.label ?? `image ${index + 1}`}`}
                  className={`relative block aspect-square w-full overflow-hidden rounded-[12px] border-2 transition-[border-color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black ${
                    selected
                      ? 'border-rave-red shadow-[0_0_18px_rgba(255,23,61,0.4)]'
                      : 'border-white/10 opacity-75 hover:border-white/35 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={image.image.src}
                    alt=""
                    fill
                    loading="lazy"
                    sizes="112px"
                    className="object-cover"
                  />
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={`${productTitle} — ${active.label ?? 'enlarged image'}`}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) closeZoom();
        }}
        className="m-auto w-[min(92vw,86vh,880px)] overflow-visible bg-transparent p-0 text-white backdrop:bg-black/85 backdrop:backdrop-blur-sm"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-[20px] border border-white/15 bg-rave-deep">
          <Image
            src={active.image.src}
            alt={active.image.alt}
            fill
            sizes="880px"
            className="object-contain"
          />
          <button
            type="button"
            onClick={closeZoom}
            aria-label="Close enlarged image"
            className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black/70 text-white transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </dialog>
    </motion.div>
  );
}
