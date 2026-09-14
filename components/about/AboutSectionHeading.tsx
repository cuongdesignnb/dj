'use client';

import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { aboutReveal, aboutStagger } from '@/lib/animations';

interface Props {
  eyebrow?: string;
  title: string;
  /** Small context line on the right (e.g. "MUSIC × PEOPLE × PLACE × PURPOSE"). */
  context?: string;
  /** Single H1 vs H2 within a section. */
  as?: 'h1' | 'h2';
  align?: 'left' | 'center';
}

export default function AboutSectionHeading({
  eyebrow,
  title,
  context,
  align = 'left',
  as = 'h2',
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const Heading = as as 'h1' | 'h2';
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <motion.div
      ref={ref}
      variants={aboutStagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 ${align === 'center' ? 'flex-col items-center text-center' : 'flex-col items-start text-left'}`}
    >
      <div className={`flex flex-col gap-3 ${alignment}`}>
        {eyebrow && (
          <motion.span
            variants={aboutReveal}
            className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-rave-red font-semibold"
          >
            {eyebrow}
          </motion.span>
        )}
        <Heading
          className={`font-heading uppercase leading-[1.05] font-black text-white text-3xl sm:text-4xl md:text-5xl ${
            title.length > 22 ? 'lg:text-[3.25rem]' : 'lg:text-[3.5rem]'
          }`}
        >
          {title}
        </Heading>
      </div>
      {context && (
        <motion.span
          variants={aboutReveal}
          className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-rave-muted whitespace-nowrap"
        >
          {context}
        </motion.span>
      )}
      {!reduced && (
        <motion.span
          aria-hidden
          variants={aboutReveal}
          className="block origin-left h-[3px] w-20 sm:w-24 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55), 0 0 36px rgba(255,23,61,0.3)' }}
        />
      )}
    </motion.div>
  );
}
