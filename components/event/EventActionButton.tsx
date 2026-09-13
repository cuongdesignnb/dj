'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { ResolvedAction } from '@/lib/events/presentation';

interface EventActionButtonProps {
  action: ResolvedAction;
  variant: 'primary' | 'secondary' | 'ghost';
  label: string;
  reducedMotion?: boolean;
}

export default function EventActionButton({
  action,
  variant,
  label,
  reducedMotion,
}: EventActionButtonProps) {
  const base =
    'group relative inline-flex items-center justify-center gap-2 font-heading uppercase tracking-wider text-sm sm:text-base font-semibold rounded-[14px] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black overflow-hidden px-6 py-3.5 sm:px-7 sm:py-4';

  const variants = {
    primary:
      'bg-gradient-to-r from-rave-red to-rave-red2 text-white border border-white/10 hover:brightness-110 shadow-[0_0_24px_rgba(255,23,61,0.45)] hover:shadow-[0_0_36px_rgba(255,23,61,0.65)]',
    secondary:
      'bg-transparent text-white border border-rave-red/45 hover:border-rave-red hover:bg-rave-red/10',
    ghost:
      'bg-transparent border border-white/10 text-white/85 hover:text-white hover:border-white/25 hover:bg-white/[0.04]',
  } as const;

  const motionProps = reducedMotion
    ? {}
    : {
        whileHover: { scale: 1.02, y: -2 },
        whileTap: { scale: 0.98 },
        transition: { type: 'spring' as const, stiffness: 280, damping: 26 },
      };

  const children = (
    <>
      {/* Hover light sweep on primary */}
      {variant === 'primary' && !reducedMotion && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 group-hover:left-full transition-[left] duration-700 ease-out"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            filter: 'blur(8px)',
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-2">
        <span>{label}</span>
        <motion.span
          aria-hidden
          className="inline-flex"
          animate={reducedMotion ? undefined : { x: 0 }}
          whileHover={reducedMotion ? undefined : { x: 4 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <ArrowRight className="w-4 h-4" />
        </motion.span>
      </span>
    </>
  );

  if (action.external) {
    return (
      <motion.a
        href={action.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${variants[variant]}`}
        {...motionProps}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.div {...motionProps} className="inline-flex">
      <Link href={action.href} className={`${base} ${variants[variant]}`}>
        {children}
      </Link>
    </motion.div>
  );
}
