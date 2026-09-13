'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface DancingPersonProps {
  delay: number;
  x: number;
  scale?: number;
  flip?: boolean;
}

function DancingSilhouette({ delay, x, scale = 1, flip = false }: DancingPersonProps) {
  // Different dance moves as keyframe variations
  const danceMoves = [
    { rotate: [-5, 5, -5], y: [0, -8, 0] },
    { rotate: [-8, 8, -8], y: [0, -5, 0], x: [-3, 3, -3] },
    { rotate: [0, 8, 0, -8, 0], y: [-10, -2, -10, -2, -10] },
    { rotate: [-3, 3, -3], y: [0, -12, 0] },
    { x: [-5, 5, -5], y: [0, -6, 0] },
  ];

  const moveIndex = Math.floor(Math.random() * danceMoves.length);
  const selectedMove = danceMoves[moveIndex];

  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${x}%`, transform: `scale(${scale}) ${flip ? 'scaleX(-1)' : ''}` }}
      animate={selectedMove}
      transition={{
        duration: 0.4 + Math.random() * 0.3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      {/* Simplified dancing person silhouette */}
      <svg
        width="60"
        height="120"
        viewBox="0 0 60 120"
        fill="none"
        className="opacity-20"
        style={{ filter: 'blur(1px)' }}
      >
        {/* Head */}
        <ellipse cx="30" cy="12" rx="8" ry="9" fill="currentColor" />
        {/* Body */}
        <path
          d="M30 21 C20 25, 15 40, 20 55 L25 55 L28 45 L30 55 L32 45 L35 55 L40 55 C45 40, 40 25, 30 21"
          fill="currentColor"
        />
        {/* Left Arm */}
        <motion.path
          d="M22 28 C15 25, 8 20, 5 15"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              'M22 28 C15 25, 8 20, 5 15',
              'M22 28 C18 22, 15 15, 12 8',
              'M22 28 C15 25, 8 20, 5 15',
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Right Arm */}
        <motion.path
          d="M38 28 C45 25, 52 20, 55 15"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              'M38 28 C45 25, 52 20, 55 15',
              'M38 28 C42 22, 45 15, 48 8',
              'M38 28 C45 25, 52 20, 55 15',
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Left Leg */}
        <motion.path
          d="M25 55 L20 85 L15 115"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              'M25 55 L20 85 L15 115',
              'M25 55 L25 85 L30 110',
              'M25 55 L20 85 L15 115',
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        {/* Right Leg */}
        <motion.path
          d="M35 55 L40 85 L45 115"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          animate={{
            d: [
              'M35 55 L40 85 L45 115',
              'M35 55 L35 85 L30 110',
              'M35 55 L40 85 L45 115',
            ],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}

interface HandsUpSilhouetteProps {
  delay: number;
  x: number;
  scale?: number;
}

function HandsUpSilhouette({ delay, x, scale = 1 }: HandsUpSilhouetteProps) {
  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${x}%`, transform: `scale(${scale})` }}
      animate={{
        y: [0, -15, -5, -12, 0],
        rotate: [-3, 3, -3],
      }}
      transition={{
        duration: 0.6 + Math.random() * 0.4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      <svg
        width="50"
        height="100"
        viewBox="0 0 50 100"
        fill="none"
        className="opacity-15"
        style={{ filter: 'blur(1px)' }}
      >
        {/* Head */}
        <ellipse cx="25" cy="10" rx="7" ry="8" fill="currentColor" />
        {/* Body */}
        <ellipse cx="25" cy="35" rx="10" ry="18" fill="currentColor" />
        {/* Left Arm Up */}
        <motion.path
          d="M18 25 L5 -5"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [-10, 10, -10] }}
          style={{ originX: '18px', originY: '25px' }}
        />
        {/* Right Arm Up */}
        <motion.path
          d="M32 25 L45 -5"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [10, -10, 10] }}
          style={{ originX: '32px', originY: '25px' }}
        />
        {/* Legs */}
        <path d="M20 50 L15 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M30 50 L35 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

export default function DancingCrowd({ count = 25 }: { count?: number }) {
  const people = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (i / count) * 100 + Math.random() * 5,
      delay: Math.random() * 2,
      scale: 0.5 + Math.random() * 0.6,
      flip: Math.random() > 0.5,
      type: Math.random() > 0.6 ? 'handsUp' : 'dancing',
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none text-rave-red">
      {people.map((person) =>
        person.type === 'handsUp' ? (
          <HandsUpSilhouette
            key={person.id}
            x={person.x}
            delay={person.delay}
            scale={person.scale}
          />
        ) : (
          <DancingSilhouette
            key={person.id}
            x={person.x}
            delay={person.delay}
            scale={person.scale}
            flip={person.flip}
          />
        )
      )}
    </div>
  );
}

// Laser light beams overlay
export function LaserLights() {
  const beams = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      color: ['#ff173d', '#8b2cff', '#2e6bff', '#ff0a78'][i % 4],
      angle: -60 + i * 15,
      delay: i * 0.3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {beams.map((beam) => (
        <motion.div
          key={beam.id}
          className="absolute top-0 w-[3px] h-[200%]"
          style={{
            left: `${10 + beam.id * 12}%`,
            background: `linear-gradient(to bottom, ${beam.color}, transparent)`,
            transformOrigin: 'top center',
            filter: 'blur(2px)',
          }}
          animate={{
            rotate: [beam.angle - 10, beam.angle + 10, beam.angle - 10],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3 + beam.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: beam.delay,
          }}
        />
      ))}
    </div>
  );
}

// Disco ball effect
export function DiscoBall() {
  return (
    <motion.div
      className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
      animate={{
        rotate: 360,
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Disco ball */}
      <div
        className="w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #fff, #666)',
          boxShadow: '0 0 50px rgba(255,255,255,0.3), 0 0 100px rgba(255,255,255,0.1)',
        }}
      />
      {/* Light reflections */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-white"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${i * 60}deg) translateY(-40px)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </motion.div>
  );
}
