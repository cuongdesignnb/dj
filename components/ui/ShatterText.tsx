'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { stableSigned, stableUnit } from '@/lib/stable-visual';

interface Fragment {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  delay: number;
  skewX: number;
  skewY: number;
}

// Generate random fragments for text shatter
function generateFragments(charCount: number): Fragment[] {
  const fragments: Fragment[] = [];
  let id = 0;

  for (let i = 0; i < charCount; i++) {
    // Create multiple fragments per character
    const fragCount = 3 + Math.floor(stableUnit((i + 1) * 17) * 3);
    for (let j = 0; j < fragCount; j++) {
      const seed = (i + 1) * 97 + (j + 1) * 13;
      fragments.push({
        id: id++,
        x: (i / charCount) * 100 + stableSigned(seed, 5),
        y: stableUnit(seed + 1) * 100,
        rotation: stableSigned(seed + 2, 30),
        scale: 0.3 + stableUnit(seed + 3) * 0.7,
        opacity: 1,
        delay: i * 0.05 + j * 0.02,
        skewX: stableSigned(seed + 4, 10),
        skewY: stableSigned(seed + 5, 10),
      });
    }
  }
  return fragments;
}

interface ShatterTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  shatterOnHover?: boolean;
  autoShatter?: boolean;
  shatterInterval?: number;
}

export default function ShatterText({
  text,
  className = '',
  tag: Tag = 'span',
  shatterOnHover = false,
  autoShatter = false,
  shatterInterval = 5000,
}: ShatterTextProps) {
  const [isShattered, setIsShattered] = useState(false);
  const [fragments] = useState<Fragment[]>(() => generateFragments(text.length));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerShatter = useCallback(() => {
    setIsShattered(true);
    setTimeout(() => {
      setIsShattered(false);
    }, 1500);
  }, []);

  // Auto shatter effect
  useEffect(() => {
    if (autoShatter && !shatterOnHover) {
      intervalRef.current = setInterval(triggerShatter, shatterInterval);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  });

  const handleMouseEnter = useCallback(() => {
    if (shatterOnHover) triggerShatter();
  }, [shatterOnHover, triggerShatter]);

  const charWidth = 100 / text.length;

  return (
    <motion.div
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Original text - fades out when shattered */}
      <AnimatePresence>
        {!isShattered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="relative"
          >
            <Tag className="relative z-10">{text}</Tag>

            {/* Glow overlay */}
            <Tag
              className="absolute inset-0 z-0 pointer-events-none"
              style={{
                WebkitTextStroke: '0px',
                filter: `drop-shadow(0 0 10px rgba(255,23,61,0.8)) drop-shadow(0 0 20px rgba(255,23,61,0.5)) drop-shadow(0 0 40px rgba(255,23,61,0.3))`,
              }}
            >
              {text}
            </Tag>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shattered fragments */}
      <AnimatePresence>
        {isShattered && (
          <div className="absolute inset-0">
            {fragments.map((frag) => (
              <motion.div
                key={frag.id}
                className="absolute"
                style={{
                  left: `${frag.x}%`,
                  top: `${frag.y}%`,
                  width: `${charWidth * 1.5}%`,
                }}
                initial={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  skewX: 0,
                  skewY: 0,
                }}
                animate={{
                  opacity: [1, 1, 0],
                  x: frag.x * 5,
                  y: frag.y * 3 + stableUnit(frag.id + 500) * 100,
                  rotate: frag.rotation + stableSigned(frag.id + 600, 90),
                  scale: frag.scale * (0.5 + stableUnit(frag.id + 700) * 0.5),
                  skewX: frag.skewX,
                  skewY: frag.skewY,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.2,
                  delay: frag.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                <Tag className="text-rave-red">{text[Math.floor(frag.x / (100 / text.length))] || text[0]}</Tag>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Simple shatter with CSS clip-path
interface SimpleShatterTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  onShatter?: () => void;
}

export function SimpleShatterText({
  text,
  className = '',
  tag: Tag = 'span',
  onShatter,
}: SimpleShatterTextProps) {
  const [isShattered, setIsShattered] = useState(false);

  const triggerShatter = useCallback(() => {
    setIsShattered(true);
    onShatter?.();
    setTimeout(() => setIsShattered(false), 1500);
  }, [onShatter]);

  return (
    <div className="relative inline-block" onClick={triggerShatter}>
      {/* Normal text */}
      <motion.div
        animate={isShattered ? { opacity: 0, scale: 1.1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Tag className={className}>{text}</Tag>
      </motion.div>

      {/* Shatter effect - pieces flying */}
      {isShattered && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${(i % 4) * 25}%`,
                top: `${Math.floor(i / 4) * 33}%`,
              }}
              animate={{
                x: stableSigned(i + 800, 100),
                y: stableUnit(i + 900) * 300 + 50,
                rotate: stableSigned(i + 1000, 360),
                opacity: [1, 1, 0],
                scale: [1, 0.5, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <Tag className={`${className} text-rave-red`}>
                {text.charAt(i % text.length)}
              </Tag>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// Glitch shatter effect with light rays
export function GlitchShatterText({
  text,
  className = '',
  tag: Tag = 'h1',
}: {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3';
}) {
  const [isShattered, setIsShattered] = useState(false);
  const [showRays, setShowRays] = useState(false);

  const triggerShatter = () => {
    setShowRays(true);
    setIsShattered(true);
    setTimeout(() => {
      setIsShattered(false);
      setShowRays(false);
    }, 1200);
  };

  return (
    <div className="relative inline-block cursor-pointer" onClick={triggerShatter}>
      {/* Light rays effect */}
      {showRays && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 bg-gradient-to-t from-white to-transparent"
              style={{
                height: '200px',
                transform: `rotate(${i * 30}deg)`,
                transformOrigin: 'bottom center',
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: [0, 1, 0], scaleY: [0, 1.5, 0] }}
              transition={{ duration: 0.6, delay: i * 0.02 }}
            />
          ))}
        </div>
      )}

      {/* Main text */}
      <motion.div
        animate={
          isShattered
            ? {
                scale: [1, 1.1, 0.9],
                filter: [
                  'brightness(1)',
                  'brightness(2)',
                  'brightness(0.5)',
                  'brightness(1)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.5 }}
      >
        {/* Layer 1 - Red offset */}
        <Tag
          className={`absolute inset-0 ${className}`}
          style={{
            color: '#ff173d',
            clipPath: isShattered ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' : undefined,
            transform: isShattered ? 'translate(-5px, -3px)' : 'none',
            opacity: isShattered ? 0 : 1,
            filter: 'blur(2px)',
          }}
        >
          {text}
        </Tag>

        {/* Layer 2 - Cyan offset */}
        <Tag
          className={`absolute inset-0 ${className}`}
          style={{
            color: '#00ffff',
            transform: isShattered ? 'translate(5px, 3px)' : 'none',
            opacity: isShattered ? 0 : 1,
            filter: 'blur(2px)',
          }}
        >
          {text}
        </Tag>

        {/* Layer 3 - Main white */}
        <Tag
          className={`relative z-10 ${className} ${
            isShattered ? 'animate-glitch' : ''
          }`}
        >
          {text}
        </Tag>
      </motion.div>

      {/* Falling pieces when shattered */}
      {isShattered && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(text.length)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white font-heading font-black"
              style={{
                left: `${(i / text.length) * 100}%`,
                top: '20%',
                fontSize: 'inherit',
              }}
              initial={{ opacity: 1, y: 0, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0],
                y: stableUnit(i + 1100) * 400 + 200,
                x: stableSigned(i + 1200, 100),
                rotate: stableSigned(i + 1300, 180),
              }}
              transition={{ duration: 1.5, delay: i * 0.05 }}
            >
              {text.charAt(i)}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
