'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

/**
 * Stepper for group size.
 *
 * No upper bound is imposed: the package is designed for a certain number, but
 * a larger group is something the team can review, not something the form
 * should refuse. Exceeding it surfaces a warning beside the field instead.
 */
export default function GroupSizeControl({
  value,
  min = 1,
  onChange,
  describedBy,
  invalid,
}: {
  value: number;
  min?: number;
  onChange(value: number): void;
  describedBy?: string;
  invalid?: boolean;
}) {
  const reduced = useReducedMotion();
  const valueId = useId();

  const clamp = (next: number) => Math.max(min, Math.trunc(Number.isFinite(next) ? next : min));

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-[14px] border bg-white/[0.03] p-1.5 ${
        invalid ? 'border-rave-red' : 'border-white/[0.12]'
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease group size"
        aria-controls={valueId}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-white transition-colors duration-200 hover:bg-rave-red/15 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:text-rave-muted/40 disabled:hover:bg-transparent"
      >
        <Minus aria-hidden className="h-4 w-4" />
      </button>

      <motion.span
        id={valueId}
        role="spinbutton"
        aria-label="Group size"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        tabIndex={-1}
        key={value}
        initial={reduced ? false : { scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 460, damping: 24 }}
        className="flex-1 text-center font-heading text-lg font-bold tabular-nums text-white"
      >
        {value}
      </motion.span>

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        aria-label="Increase group size"
        aria-controls={valueId}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] text-white transition-colors duration-200 hover:bg-rave-red/15 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black"
      >
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
