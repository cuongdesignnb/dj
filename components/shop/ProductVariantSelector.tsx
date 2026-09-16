'use client';

import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ProductColor, ProductOptionValue } from '@/lib/shop/types';

/** Arrow-key movement shared by both option groups. */
function useRoving<T extends { id: string }>(
  items: T[],
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = items.findIndex((item) => item.id === selectedId);
  // With nothing selected, the first option takes focus.
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex;

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    let next = index;
    // Skip options known to be unavailable.
    for (let step = 0; step < items.length; step++) {
      next = (next + delta + items.length) % items.length;
      const item = items[next] as T & { available?: boolean | null };
      if (item.available !== false) break;
    }
    onSelect(items[next].id);
    refs.current[next]?.focus();
  };

  return { refs, focusIndex, onKeyDown };
}

export function SizeSelector({
  sizes,
  selectedId,
  onSelect,
  labelId,
}: {
  sizes: ProductOptionValue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  labelId: string;
}) {
  const reduced = useReducedMotion();
  const { refs, focusIndex, onKeyDown } = useRoving(sizes, selectedId, onSelect);

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-2.5">
      {sizes.map((size, index) => {
        const selected = size.id === selectedId;
        const unavailable = size.available === false;
        return (
          <button
            key={size.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-disabled={unavailable || undefined}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => !unavailable && onSelect(size.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`relative min-h-[44px] min-w-[60px] rounded-[10px] border px-4 font-heading text-sm font-semibold uppercase tracking-wider transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black ${
              selected
                ? 'border-rave-red text-white'
                : unavailable
                  ? 'cursor-not-allowed border-white/10 text-white/30 line-through'
                  : 'border-white/20 text-white/85 hover:border-white/45 hover:text-white'
            }`}
          >
            {selected && (
              <motion.span
                aria-hidden
                layoutId={reduced ? undefined : 'size-selection'}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className="absolute inset-0 rounded-[9px] bg-rave-red/20 shadow-[0_0_18px_rgba(255,23,61,0.35)]"
              />
            )}
            <span className="relative">{size.label}</span>
            {unavailable && <span className="sr-only"> (unavailable)</span>}
          </button>
        );
      })}
    </div>
  );
}

export function ColorSelector({
  colors,
  selectedId,
  onSelect,
  labelId,
}: {
  colors: ProductColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  labelId: string;
}) {
  const { refs, focusIndex, onKeyDown } = useRoving(colors, selectedId, onSelect);

  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-wrap gap-3">
      {colors.map((color, index) => {
        const selected = color.id === selectedId;
        return (
          <button
            key={color.id}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === focusIndex ? 0 : -1}
            onClick={() => onSelect(color.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="group/swatch inline-flex min-h-[44px] items-center gap-3 rounded-full pr-3 text-sm text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
          >
            <span
              aria-hidden
              className={`grid h-11 w-11 place-items-center rounded-full border-2 transition-[border-color,box-shadow] duration-300 ${
                selected
                  ? 'border-rave-red shadow-[0_0_16px_rgba(255,23,61,0.45)]'
                  : 'border-white/25 group-hover/swatch:border-white/50'
              }`}
            >
              <span
                className="h-7 w-7 rounded-full border border-white/20"
                style={{ backgroundColor: color.hex ?? '#1a1a1f' }}
              />
            </span>
            {color.name}
          </button>
        );
      })}
    </div>
  );
}
