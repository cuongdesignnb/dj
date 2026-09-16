'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { adminCardReveal, adminPageReveal, adminStagger } from '@/lib/animations';

/** Short entrance for a page. Honours reduced motion through the shell's MotionConfig. */
export function PageReveal({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={adminPageReveal} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

export function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={adminStagger} initial="hidden" animate="visible" className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={adminCardReveal} className={className}>
      {children}
    </motion.div>
  );
}
