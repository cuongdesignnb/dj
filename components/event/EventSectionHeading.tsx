'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { lineReveal, underlineReveal } from '@/lib/events/motion';

interface Props {
  eyebrow?: string;
  title: string;
  id?: string;
  align?: 'left' | 'center';
}

export default function EventSectionHeading({ eyebrow, title, id, align = 'left' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';
  return (
    <div ref={ref} className={`flex flex-col gap-3 ${alignment}`}>
      {eyebrow && (
        <motion.span
          variants={lineReveal}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-rave-red font-bold"
        >
          {eyebrow}
        </motion.span>
      )}
      <div className="relative">
        <motion.h2
          id={id}
          variants={lineReveal}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="font-heading text-3xl sm:text-4xl md:text-5xl font-black uppercase leading-[1.05] text-white"
        >
          {title}
        </motion.h2>
        <motion.span
          aria-hidden
          variants={underlineReveal}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="block origin-left h-[3px] mt-3 w-24 sm:w-28 rounded-full bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red"
          style={{ boxShadow: '0 0 18px rgba(255,23,61,0.55), 0 0 36px rgba(255,23,61,0.3)' }}
        />
      </div>
    </div>
  );
}
