'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface AudioBarsProps {
  count?: number;
  width?: number;
  height?: number;
  gap?: number;
  colors?: string[];
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export default function AudioBars({
  count = 5,
  width = 4,
  height = 40,
  gap = 3,
  colors = ['#ff173d', '#ff304f', '#ff0a78', '#ff173d', '#ff304f'],
  minHeight = 0.2,
  maxHeight = 1,
  className = '',
}: AudioBarsProps) {
  // Generate random heights for each bar
  const bars = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      minH: minHeight + Math.random() * 0.3,
      maxH: Math.min(maxHeight, minHeight + 0.5 + Math.random() * 0.5),
      delay: i * 0.1,
      duration: 0.4 + Math.random() * 0.4,
    }));
  }, [count, minHeight, maxHeight]);

  return (
    <div
      className={`flex items-end justify-center ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="rounded-full"
          style={{
            width,
            height,
            background: `linear-gradient(to top, ${colors[bar.id % colors.length]}, ${colors[(bar.id + 1) % colors.length]})`,
            boxShadow: `0 0 8px ${colors[bar.id % colors.length]}80`,
          }}
          animate={{
            scaleY: [bar.minH, bar.maxH, bar.minH],
          }}
          transition={{
            duration: bar.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: bar.delay,
          }}
        />
      ))}
    </div>
  );
}

interface LargeAudioBarsProps {
  className?: string;
}

export function LargeAudioBars({ className = '' }: LargeAudioBarsProps) {
  return (
    <div className={`flex items-end gap-1 ${className}`}>
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-rave-red to-rave-magenta rounded-full"
          style={{ height: '40px' }}
          animate={{
            height: ['20px', `${30 + Math.random() * 20}px`, '20px'],
          }}
          transition={{
            duration: 0.3 + Math.random() * 0.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  );
}

interface PulsingCircleProps {
  size?: number;
  color?: string;
  className?: string;
}

export function PulsingCircle({
  size = 100,
  color = '#ff173d',
  className = ''
}: PulsingCircleProps) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Core circle */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, filter: 'blur(2px)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer ring 1 */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: color,
          opacity: 0.6,
        }}
        animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Outer ring 2 */}
      <motion.div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: color,
          opacity: 0.4,
        }}
        animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
      />
    </div>
  );
}
