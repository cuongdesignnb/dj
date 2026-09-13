'use client';

import { MotionConfig, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function EventMotion({ children }: { children: ReactNode }) {
  // Honor user's reduced-motion preference at the root for the /event tree.
  // Individual subcomponents also short-circuit ambient loops and tilt when
  // useReducedMotion() is true.
  const reduced = useReducedMotion();
  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>{children}</MotionConfig>
  );
}
