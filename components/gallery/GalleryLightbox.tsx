'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryMediaItem } from '@/lib/gallery/types';
import { categoryLabel } from '@/lib/gallery/helpers';

/**
 * Fullscreen media viewer.
 *
 * A real dialog: aria-modal, focus moved in on open and restored to the card
 * that opened it on close, Tab cycles inside, Escape closes, arrows move.
 * Navigation stops at the ends rather than wrapping, and the boundary buttons
 * are disabled so the limit is visible instead of surprising.
 *
 * Only the current image and its two neighbours are ever requested, so opening
 * one photo never pulls a whole album over the wire.
 */
export default function GalleryLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: GalleryMediaItem[];
  /** Null when closed. */
  index: number | null;
  onClose(): void;
  onNavigate(nextIndex: number): void;
}) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index] : null;
  const atStart = index === 0;
  const atEnd = index !== null && index === items.length - 1;

  const goPrevious = useCallback(() => {
    if (index === null || index <= 0) return;
    onNavigate(index - 1);
  }, [index, onNavigate]);

  const goNext = useCallback(() => {
    if (index === null || index >= items.length - 1) return;
    onNavigate(index + 1);
  }, [index, items.length, onNavigate]);

  // Remember what had focus, move focus into the dialog, restore on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

  // Keep the page behind from scrolling while the dialog is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
        return;
      }
      if (event.key !== 'Tab') return;

      // Focus trap.
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, goPrevious, goNext]);

  // Only the neighbours are prefetched — never the whole set.
  const neighbours = open
    ? [items[(index as number) - 1], items[(index as number) + 1]].filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.12 : 0.22 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/94 p-4 backdrop-blur-sm sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Media viewer, item ${(index as number) + 1} of ${items.length}`}
            className="relative flex h-full w-full max-w-6xl flex-col"
          >
            {/* Controls */}
            <div className="flex shrink-0 items-center justify-between gap-4 pb-3">
              <p className="font-heading text-xs uppercase tracking-[0.22em] text-white/70 sm:text-sm">
                {(index as number) + 1} / {items.length}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close media viewer"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            {/* Media */}
            <div className="relative flex min-h-0 flex-1 items-center justify-center">
              <motion.div
                key={item.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduced ? 0.12 : 0.25 }}
                className="relative h-full w-full"
              >
                <Image
                  src={(item.image ?? item.thumbnail).src}
                  alt={(item.image ?? item.thumbnail).alt}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </motion.div>

              <button
                type="button"
                onClick={goPrevious}
                disabled={atStart}
                aria-label="Previous media"
                className="absolute left-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white"
              >
                <ChevronLeft aria-hidden className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={atEnd}
                aria-label="Next media"
                className="absolute right-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/70 text-white transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-white"
              >
                <ChevronRight aria-hidden className="h-6 w-6" />
              </button>
            </div>

            {/* Caption */}
            <motion.div
              key={`${item.id}-caption`}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.12 : 0.25 }}
              className="shrink-0 pt-3 text-center"
            >
              <p className="font-heading text-xs uppercase tracking-[0.22em] text-rave-red sm:text-sm">
                {categoryLabel(item.category)}
              </p>
              {(item.title || item.caption) && (
                <p className="mt-1 text-sm text-white/80">
                  {[item.title, item.caption].filter(Boolean).join(' — ')}
                </p>
              )}
            </motion.div>
          </div>

          {/* Neighbour prefetch, off-screen and never announced. */}
          <div aria-hidden className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0">
            {neighbours.map((neighbour) => (
              <Image
                key={`preload-${neighbour.id}`}
                src={(neighbour.image ?? neighbour.thumbnail).src}
                alt=""
                width={16}
                height={16}
                sizes="16px"
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
