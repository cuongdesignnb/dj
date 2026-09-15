'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { VipBottle, VipPackage } from '@/lib/vip/types';
import { vipReveal, vipStagger } from '@/lib/animations';
import BottleVisual from './BottleVisual';

/**
 * Bottle picker shared by /tables and /book-now.
 *
 * Cards behave as checkboxes: `role="checkbox"` with `aria-checked`, focusable,
 * and togglable with Enter or Space. Reaching the cap does not silently evict an
 * earlier choice — it surfaces a message and leaves the selection alone.
 */
export default function BottleSelector({
  bottles,
  selected,
  pkg,
  onToggle,
  limitMessage,
  columnsClassName = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  describedBy,
}: {
  bottles: VipBottle[];
  selected: string[];
  pkg: Pick<VipPackage, 'maxBottleSelections'>;
  onToggle(bottleId: string): void;
  limitMessage?: string | null;
  columnsClassName?: string;
  describedBy?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <div>
      <motion.ul
        variants={vipStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        role="group"
        aria-label="Bottle preferences"
        aria-describedby={describedBy}
        className={`grid gap-4 ${columnsClassName}`}
      >
        {bottles.map((bottle) => {
          const isSelected = selected.includes(bottle.id);
          const atCap = !isSelected && selected.length >= pkg.maxBottleSelections;

          return (
            <motion.li key={bottle.id} variants={vipReveal}>
              <motion.button
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={!bottle.enabled}
                onClick={() => onToggle(bottle.id)}
                whileHover={reduced || atCap ? undefined : { y: -4 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                className={`group relative flex h-full w-full flex-col items-center gap-3 rounded-[16px] border p-4 text-center transition-[border-color,box-shadow,opacity] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? 'border-rave-red bg-rave-red/[0.07] shadow-[0_0_28px_rgba(255,23,61,0.26)]'
                    : `border-white/[0.08] bg-rave-panel/70 ${atCap ? 'opacity-60' : 'hover:border-rave-red/40'}`
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full border transition-colors duration-200 ${
                    isSelected
                      ? 'border-rave-red bg-rave-red text-white'
                      : 'border-white/25 bg-black/40 text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>

                <span className="flex h-24 items-end justify-center sm:h-28">
                  {bottle.image?.src ? (
                    <span className="relative block h-24 w-16 sm:h-28 sm:w-20">
                      <Image
                        src={bottle.image.src}
                        alt={bottle.image.alt || bottle.name}
                        fill
                        sizes="80px"
                        className="object-contain"
                      />
                    </span>
                  ) : (
                    <motion.span
                      className="block h-24 sm:h-28"
                      variants={{ rest: { scale: 1 }, hover: { scale: 1.03 } }}
                    >
                      <BottleVisual tint={bottle.tint} name={bottle.name} />
                    </motion.span>
                  )}
                </span>

                <span className="font-heading text-[11px] font-bold uppercase leading-tight tracking-[0.1em] text-white sm:text-xs">
                  {bottle.name}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>

      <AnimatePresence>
        {limitMessage && (
          <motion.p
            role="status"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-sm text-rave-red"
          >
            {limitMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
