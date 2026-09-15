'use client';

import { MotionConfig, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/**
 * Root motion settings for the /events tree.
 *
 * `reducedMotion: 'always'` makes Motion drop transform and layout animation
 * and keep only opacity, so the entrance reveals degrade to a plain fade for
 * anyone who asked for reduced motion. Individual sections additionally
 * short-circuit tilt, parallax, the light sweep and ambient glow loops.
 */
export default function EventsMotion({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>{children}</MotionConfig>;
}
