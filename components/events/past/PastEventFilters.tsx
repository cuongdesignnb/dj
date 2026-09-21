'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, CirclePlay, Images, LayoutGrid, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PastEventFilter } from '@/lib/events/listing-types';
import { useEventsFilter } from '../EventsFilterProvider';

interface FilterOption {
  value: PastEventFilter;
  label: string;
  Icon: LucideIcon;
}

const OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All Recaps', Icon: LayoutGrid },
  { value: 'featured', label: 'Featured', Icon: Star },
  { value: 'gallery', label: 'Photo Gallery', Icon: Images },
  { value: 'highlights', label: 'Highlights', Icon: CirclePlay },
];

/**
 * Filter chips for the EVENT ARCHIVE grid. Same radio-group semantics as the
 * upcoming-events bar: arrow keys move, the active chip is marked by a check
 * icon and `aria-checked` as well as colour.
 */
export default function PastEventFilters({
  controls,
  label = 'Filter archive',
  optionLabels,
}: {
  controls?: string;
  label?: string;
  optionLabels?: string[];
}) {
  const { filter, setFilter } = useEventsFilter<PastEventFilter>();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const options = OPTIONS.map((option, index) => ({
    ...option,
    label: optionLabels?.[index] || option.label,
  }));

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length;
    setFilter(options[next].value);
    buttons.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-controls={controls}
      className="flex flex-wrap items-center gap-2.5 sm:gap-3"
    >
      {options.map((option, index) => {
        const active = option.value === filter;
        const { Icon } = option;

        return (
          <motion.button
            key={option.value}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => setFilter(option.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                move(index, 1);
              } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                move(index, -1);
              }
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black sm:text-sm ${
              active
                ? 'border-rave-red bg-rave-red/12 text-white shadow-[0_0_20px_rgba(255,23,61,0.28)]'
                : 'border-white/[0.10] bg-white/[0.02] text-rave-muted hover:border-white/25 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <span
              aria-hidden
              className={`grid h-5 w-5 place-items-center rounded-md transition-colors ${
                active ? 'bg-rave-red/20 text-rave-red' : 'text-rave-muted'
              }`}
            >
              {active ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </span>
            <span>{option.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
