// Reusable motion variants for the /event page.
// Kept here to avoid touching the existing homepage animation presets.

import type { Variants } from 'framer-motion';

export const easeOutCinematic: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const heroStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const lineReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutCinematic } },
};

export const underlineReveal: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.45, ease: easeOutCinematic, delay: 0.1 },
  },
};

export const cardStagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const cardItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: easeOutCinematic } },
};

export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const lightSweepKeyframes = {
  hidden: { x: '-120%' },
  visible: { x: '120%' },
};

export const lightSweepTransition = {
  duration: 0.9,
  ease: easeOutCinematic,
};
