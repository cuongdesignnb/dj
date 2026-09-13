'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/lib/animations';

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
};

export default function SectionTitle({ eyebrow, title, subtitle, align = 'center' }: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={`flex flex-col gap-3 mb-10 md:mb-14 ${alignment}`}
    >
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          className="font-heading uppercase tracking-[0.25em] text-xs sm:text-sm text-rave-red font-semibold"
        >
          {eyebrow}
        </motion.span>
      )}

      <div className="relative">
        <motion.h2
          variants={fadeUp}
          className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold uppercase leading-[1.1] text-white relative z-10"
        >
          {title}
        </motion.h2>

        {/* Animated underline - gradient bar that expands */}
        <motion.div
          className="h-[3px] bg-gradient-to-r from-rave-red via-rave-magenta to-rave-red rounded-full mt-2"
          initial={{ width: 0 }}
          animate={isInView ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            boxShadow: '0 0 15px rgba(255, 23, 61, 0.6), 0 0 30px rgba(255, 23, 61, 0.3)',
          }}
        />

        {/* Glow effect under the underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-[20px] bg-gradient-to-r from-transparent via-rave-red/20 to-transparent"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        />
      </div>

      {subtitle && (
        <motion.p
          variants={fadeUp}
          className="text-rave-muted text-sm sm:text-base max-w-2xl leading-relaxed"
        >
          {subtitle}
        </motion.p>
      )}

      {/* Animated bars decoration */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-1 mt-2.5 h-6"
      >
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-rave-red to-rave-magenta"
            style={{ originY: 1 }}
            animate={isInView ? {
              height: [6, 24, 6],
            } : { height: 6 }}
            transition={{
              duration: 0.6 + (i % 3) * 0.2,
              repeat: isInView ? Infinity : 0,
              ease: 'easeInOut',
              delay: 0.4 + i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
