'use client';

import { useId } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LinkAction } from '@/lib/events/listing-types';

type Tone = 'primary' | 'secondary';

/**
 * Renders a data-driven call to action.
 *
 * When `action.href` is null the destination does not exist yet, so the button
 * is genuinely disabled and carries a visible note explaining why. It is never
 * pointed at a placeholder route just to keep it clickable.
 */
export default function EventAction({
  action,
  tone = 'primary',
  icon,
  className = '',
  fullWidth = false,
}: {
  action: LinkAction;
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
}) {
  const reduced = useReducedMotion();
  const noteId = useId();

  const base =
    'group/cta inline-flex items-center justify-center gap-2 rounded-[14px] px-5 py-3 sm:px-6 sm:py-3.5 font-heading text-sm sm:text-base uppercase tracking-wider font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black';

  const tones: Record<Tone, string> = {
    primary:
      'bg-gradient-to-r from-rave-red to-rave-red2 text-white hover:brightness-110 shadow-[0_0_22px_rgba(255,23,61,0.35)]',
    secondary:
      'border border-white/15 bg-white/[0.02] text-white hover:border-rave-red/60 hover:bg-rave-red/10',
  };

  const width = fullWidth ? 'w-full' : '';

  if (!action.href) {
    return (
      <span className={`inline-flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''} ${className}`}>
        <button
          type="button"
          disabled
          aria-describedby={action.unavailableNote ? noteId : undefined}
          className={`${base} ${width} cursor-not-allowed border border-white/20 bg-black/55 text-white/65 backdrop-blur-sm`}
        >
          {icon}
          <span>{action.label}</span>
        </button>
        {action.unavailableNote && (
          <span
            id={noteId}
            className="font-heading text-[11px] uppercase tracking-[0.16em] text-white/55"
          >
            {action.unavailableNote}
          </span>
        )}
      </span>
    );
  }

  const content = (
    <>
      {icon}
      <span>{action.label}</span>
      <motion.span
        aria-hidden
        className="inline-flex"
        variants={{ rest: { x: 0 }, hover: { x: reduced ? 0 : 3 } }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <ArrowRight className="h-4 w-4" />
      </motion.span>
    </>
  );

  const classes = `${base} ${tones[tone]} ${width} ${className}`;

  if (action.external) {
    return (
      <motion.a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        initial="rest"
        whileHover="hover"
        whileFocus="hover"
        className={classes}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.span initial="rest" whileHover="hover" className={fullWidth ? 'block w-full' : 'inline-block'}>
      <Link href={action.href} className={classes}>
        {content}
      </Link>
    </motion.span>
  );
}
