'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface LightBurstProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
}

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
}

export default function HoverLightBurst({
  children,
  className = '',
  color = '#ff173d',
  intensity = 'medium',
}: LightBurstProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [bursts, setBursts] = useState<BurstParticle[]>([]);
  const countRef = useRef(0);

  const intensityValues = {
    low: 6,
    medium: 12,
    high: 20,
  };

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Create multiple burst particles
    const newBursts: BurstParticle[] = Array.from({ length: intensityValues[intensity] }, (_, i) => ({
      id: countRef.current++,
      x,
      y,
      angle: (360 / intensityValues[intensity]) * i,
    }));

    setBursts(newBursts);
    setTimeout(() => setBursts([]), 600);
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={isHovered ? {
        boxShadow: [
          `0 0 20px ${color}40`,
          `0 0 40px ${color}60`,
          `0 0 60px ${color}40`,
        ],
      } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}

      {/* Light burst particles */}
      {bursts.map((burst) => (
        <motion.div
          key={burst.id}
          className="absolute pointer-events-none rounded-full"
          style={{
            left: burst.x,
            top: burst.y,
            width: 6,
            height: 6,
            background: color,
            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}80`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((burst.angle * Math.PI) / 180) * 80,
            y: Math.sin((burst.angle * Math.PI) / 180) * 80,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      ))}
    </motion.div>
  );
}

// Sparkle particle for cursor trail
export function CursorSparkle({ x, y, color = '#ff173d' }: { x: number; y: number; color?: string }) {
  return (
    <motion.div
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 0, y: y - 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 0L11.5 7L18 10L11.5 13L10 20L8.5 13L2 10L8.5 7L10 0Z"
          fill={color}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
    </motion.div>
  );
}

// Cursor trail component with sparkles
export function CursorTrail() {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const countRef = useRef(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const newSparkle = { id: countRef.current++, x: e.clientX, y: e.clientY };
    setSparkles((prev) => [...prev.slice(-15), newSparkle]);

    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
    }, 600);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50" onMouseMove={handleMouseMove}>
      {sparkles.map((sparkle) => (
        <CursorSparkle key={sparkle.id} x={sparkle.x} y={sparkle.y} />
      ))}
    </div>
  );
}

// Ambient floating orb
export function AmbientOrb({ size = 100, color = '#ff173d', delay = 0 }: { size?: number; color?: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color}60 0%, ${color}20 50%, transparent 70%)`,
        filter: 'blur(20px)',
      }}
      animate={{
        x: [0, 50, -30, 20, 0],
        y: [0, -40, 20, -20, 0],
        scale: [1, 1.2, 0.9, 1.1, 1],
        opacity: [0.4, 0.7, 0.5, 0.6, 0.4],
      }}
      transition={{
        duration: 15 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

// Glow ring that expands on hover
export function GlowRing({ size = 200, color = '#ff173d' }: { size?: number; color?: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        border: `2px solid ${color}80`,
        boxShadow: `0 0 30px ${color}40, inset 0 0 30px ${color}20`,
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      whileHover={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
}

// Light sweep effect
export function LightSweep({ color = '#ff173d' }: { color?: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      initial={{ x: '-100%' }}
      whileHover={{ x: '100%' }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div
        className="absolute inset-y-0 w-1/3"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
        }}
      />
    </motion.div>
  );
}

// Neon glow button with intense hover effect
export function NeonGlowButton({
  children,
  className = '',
  glowColor = '#ff173d',
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      whileHover={{
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{ filter: 'blur(15px)' }}
        whileHover={{
          opacity: [0.5, 1, 0.5],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at center, ${glowColor}60 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* Inner glow */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}40, 0 0 30px ${glowColor}30`,
        }}
        whileHover={{
          boxShadow: [
            `inset 0 0 30px ${glowColor}60, 0 0 50px ${glowColor}50`,
            `inset 0 0 40px ${glowColor}80, 0 0 70px ${glowColor}60`,
            `inset 0 0 30px ${glowColor}60, 0 0 50px ${glowColor}50`,
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {children}
    </motion.button>
  );
}
