'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

export interface TicketQuantityControlProps {
  value: number;
  min: number;
  /** Null means no provider-confirmed maximum, so the + button never locks. */
  max?: number | null;
  disabled?: boolean;
  /** Names the tier this control belongs to, for screen readers. */
  label: string;
  onChange(value: number): void;
}

/**
 * Stepper for one ticket tier.
 *
 * The buttons are real buttons with their own labels, and the live value is
 * exposed through a spinbutton role so a screen reader announces the change
 * without needing the surrounding card.
 */
export default function TicketQuantityControl({
  value,
  min,
  max = null,
  disabled = false,
  label,
  onChange,
}: TicketQuantityControlProps) {
  const reduced = useReducedMotion();
  const valueId = useId();

  const atMin = value <= min;
  const atMax = typeof max === 'number' && value >= max;

  return (
    <div className="inline-flex items-center gap-1 rounded-[14px] border border-white/[0.12] bg-white/[0.03] p-1.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || atMin}
        aria-label={`Decrease quantity for ${label}`}
        aria-controls={valueId}
        className="grid h-11 w-11 place-items-center rounded-[10px] text-white transition-colors duration-200 hover:bg-rave-red/15 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:text-rave-muted/40 disabled:hover:bg-transparent"
      >
        <Minus aria-hidden className="h-4 w-4" />
      </button>

      <motion.span
        id={valueId}
        role="spinbutton"
        aria-label={`Quantity for ${label}`}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={typeof max === 'number' ? max : undefined}
        aria-valuetext={`${value}`}
        tabIndex={-1}
        key={value}
        initial={reduced ? false : { scale: 0.86, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 460, damping: 24 }}
        className="min-w-[2.5rem] text-center font-heading text-lg font-bold tabular-nums text-white"
      >
        {value}
      </motion.span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label={`Increase quantity for ${label}`}
        aria-controls={valueId}
        className="grid h-11 w-11 place-items-center rounded-[10px] text-white transition-colors duration-200 hover:bg-rave-red/15 hover:text-rave-red focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:text-rave-muted/40 disabled:hover:bg-transparent"
      >
        <Plus aria-hidden className="h-4 w-4" />
      </button>
    </div>
  );
}
