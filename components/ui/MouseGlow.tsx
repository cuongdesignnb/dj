'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function MouseGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring config for smooth following
  const springConfig = { damping: 35, stiffness: 150, mass: 0.5 };
  const glowX = useSpring(mouseX, springConfig);
  const glowY = useSpring(mouseY, springConfig);

  // Secondary layer - smaller, more intense
  const glow2X = useSpring(mouseX, { ...springConfig, damping: 25, stiffness: 200 });
  const glow2Y = useSpring(mouseY, { ...springConfig, damping: 25, stiffness: 200 });

  const [mounted, setMounted] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleIdRef = useRef(0);

  const colors = [
    'rgba(255, 23, 61, 0.9)',    // Red
    'rgba(139, 44, 255, 0.8)',   // Purple
    'rgba(255, 10, 120, 0.8)',   // Magenta
    'rgba(46, 107, 255, 0.7)',   // Blue
    'rgba(255, 48, 79, 0.9)',    // Red2
  ];

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // Offset to center the glow on cursor
    mouseX.set(e.clientX - 150);
    mouseY.set(e.clientY - 150);
    glow2X.set(e.clientX - 80);
    glow2Y.set(e.clientY - 80);

    // Create sparkle on mouse move
    if (Math.random() > 0.7) {
      const newSparkle: Sparkle = {
        id: sparkleIdRef.current++,
        x: e.clientX + (Math.random() - 0.5) * 40,
        y: e.clientY + (Math.random() - 0.5) * 40,
        size: 4 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      setSparkles((prev) => [...prev.slice(-20), newSparkle]);

      // Remove sparkle after animation
      setTimeout(() => {
        setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
      }, 800);
    }
  }, [mouseX, mouseY, glow2X, glow2Y]);

  useEffect(() => {
    setMounted(true);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  if (!mounted) return null;

  return (
    <>
      {/* Main glow - large, soft */}
      <motion.div
        className="fixed pointer-events-none w-[300px] h-[300px] rounded-full z-30 opacity-30 mix-blend-screen hidden md:block"
        style={{
          left: glowX,
          top: glowY,
          background: 'radial-gradient(circle, rgba(255,23,61,0.5) 0%, rgba(139,44,255,0.35) 40%, rgba(46,107,255,0.15) 70%, transparent 100%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Secondary glow - medium, more vibrant */}
      <motion.div
        className="fixed pointer-events-none w-[160px] h-[160px] rounded-full z-30 opacity-40 mix-blend-screen hidden md:block"
        style={{
          left: glow2X,
          top: glow2Y,
          background: 'radial-gradient(circle, rgba(255,23,61,0.7) 0%, rgba(255,10,120,0.5) 50%, transparent 100%)',
          filter: 'blur(25px)',
        }}
      />

      {/* Core glow - small, bright */}
      <motion.div
        className="fixed pointer-events-none w-[60px] h-[60px] rounded-full z-30 hidden md:block"
        style={{
          left: glow2X,
          top: glow2Y,
          background: 'radial-gradient(circle, rgba(255,23,61,0.9) 0%, rgba(255,48,79,0.6) 50%, transparent 100%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Sparkle particles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="fixed pointer-events-none z-50 hidden md:block"
          style={{
            left: sparkle.x - sparkle.size / 2,
            top: sparkle.y - sparkle.size / 2,
            width: sparkle.size,
            height: sparkle.size,
            background: sparkle.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${sparkle.size * 2}px ${sparkle.color}, 0 0 ${sparkle.size * 4}px ${sparkle.color}`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            y: sparkle.y - 30,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}
    </>
  );
}
