'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations';

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
  neonBorder?: boolean;
  intense?: boolean;
};

export default function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(255,23,61,0.35)',
  hover = true,
  neonBorder = false,
  intense = false,
}: GlowCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={
        hover
          ? {
              y: -8,
              scale: 1.015,
              boxShadow: `0 0 34px ${glowColor}`,
            }
          : undefined
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`glass-panel rounded-2xl overflow-hidden ${
        neonBorder ? 'neon-border' : 'neon-border-soft'
      } ${intense ? 'animate-border-glow' : ''} ${className}`}
    >
      {/* Intense glow layer */}
      {intense && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: `0 0 60px ${glowColor}, inset 0 0 40px ${glowColor}`,
            filter: 'blur(20px)',
            opacity: 0.3,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
