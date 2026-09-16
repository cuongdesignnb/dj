'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

/**
 * Quantity stepper. The minimum is 1; a maximum only exists when real
 * inventory supplies one, so by default there is none.
 */
export default function QuantityControl({
  value,
  onChange,
  max = null,
  label = 'Quantity',
  labelId,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number | null;
  label?: string;
  labelId: string;
}) {
  const reduced = useReducedMotion();
  const clamp = (n: number) => Math.max(1, max == null ? n : Math.min(max, n));
  const atMin = value <= 1;
  const atMax = max != null && value >= max;

  const button =
    'grid h-11 w-11 place-items-center text-white transition-colors duration-200 hover:bg-rave-red/15 hover:text-rave-red focus:outline-none focus-visible:bg-rave-red/15 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rave-red disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-white';

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-[10px] border border-white/15 bg-white/[0.02]">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={atMin}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className={button}
      >
        <Minus aria-hidden className="h-4 w-4" />
      </button>

      <div
        role="spinbutton"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuenow={value}
        aria-valuemin={1}
        aria-valuemax={max ?? undefined}
        onKeyDown={(event) => {
          const steps: Record<string, number> = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 };
          if (event.key in steps) {
            event.preventDefault();
            onChange(clamp(value + steps[event.key]));
          } else if (event.key === 'Home') {
            event.preventDefault();
            onChange(1);
          } else if (event.key === 'End' && max != null) {
            event.preventDefault();
            onChange(max);
          }
        }}
        className="relative grid w-14 place-items-center overflow-hidden border-x border-white/15 font-heading text-lg font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rave-red"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.18 }}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={atMax}
        aria-label={`Increase ${label.toLowerCase()}`}
        className={button}
      >
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
