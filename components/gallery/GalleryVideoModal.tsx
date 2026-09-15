'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { GalleryMediaItem } from '@/lib/gallery/types';
import { buildEmbedUrl } from '@/lib/gallery/helpers';

/**
 * Video player, mounted only while open.
 *
 * Nothing is embedded on page load — no hidden iframes sitting on every card
 * phoning home. The embed URL is built by buildEmbedUrl from a validated
 * provider and id, never taken as markup from the data source, and playback
 * only starts because someone pressed play.
 */
export default function GalleryVideoModal({
  item,
  onClose,
}: {
  /** Null when closed. */
  item: GalleryMediaItem | null;
  onClose(): void;
}) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const open = !!item;
  const embedUrl = item?.video ? buildEmbedUrl(item.video) : null;

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      restoreFocusRef.current?.focus?.();
    };
  }, [open]);

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
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])',
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
  }, [open, onClose]);

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
            aria-label={`Video: ${item.title ?? 'Gallery video'}`}
            className="relative w-full max-w-5xl"
          >
            <div className="flex items-center justify-between gap-4 pb-3">
              <p className="font-heading text-xs uppercase tracking-[0.22em] text-white/70 sm:text-sm">
                {item.title ?? 'Video'}
              </p>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close video"
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/60 text-white transition-colors hover:border-rave-red hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-[16px] border border-white/[0.12] bg-black">
              {embedUrl && item.video?.provider === 'mp4' ? (
                <video
                  src={embedUrl}
                  controls
                  playsInline
                  className="h-full w-full"
                  title={item.title ?? 'Gallery video'}
                />
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={item.title ?? 'Gallery video'}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                // The slot exists but no clip has been supplied yet.
                <div className="grid h-full place-items-center px-6 text-center">
                  <div>
                    <p className="font-heading text-lg uppercase tracking-[0.14em] text-white sm:text-xl">
                      Video coming soon
                    </p>
                    <p className="mt-2 text-sm text-rave-muted">
                      This highlight has not been published yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
