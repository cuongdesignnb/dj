'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlitchTextProps {
  text: string;
  className?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'p';
  glitchOnHover?: boolean;
  autoGlitch?: boolean;
  glitchSpeed?: number;
  intensity?: 'low' | 'medium' | 'high';
}

export default function GlitchText({
  text,
  className = '',
  tag: Tag = 'span',
  glitchOnHover = false,
  autoGlitch = true,
  glitchSpeed = 3000,
  intensity = 'medium',
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    if (!autoGlitch || glitchOnHover) return;

    const triggerGlitch = () => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 300);
    };

    const interval = setInterval(triggerGlitch, glitchSpeed);
    return () => clearInterval(interval);
  }, [autoGlitch, glitchOnHover, glitchSpeed]);

  const intensityValues = {
    low: '0.5px',
    medium: '2px',
    high: '4px',
  };

  const offset = intensityValues[intensity];

  const glitchClasses = isGlitching ? 'animate-glitch' : '';
  const baseClasses = glitchOnHover ? 'hover:animate-glitch' : glitchClasses;

  const baseStyles: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
  };

  const glitchLayer1Styles: React.CSSProperties = isGlitching ? {
    position: 'absolute',
    inset: 0,
    color: '#ff173d',
    animation: 'glitch-clip-1 0.3s infinite',
    transform: `translate(${offset}, -${offset})`,
  } : { display: 'none' };

  const glitchLayer2Styles: React.CSSProperties = isGlitching ? {
    position: 'absolute',
    inset: 0,
    color: '#2e6bff',
    animation: 'glitch-clip-2 0.3s infinite',
    animationDelay: '0.15s',
    transform: `translate(-${offset}, ${offset})`,
  } : { display: 'none' };

  return (
    <motion.span
      className={`${baseClasses} ${className}`}
      style={baseStyles}
      onMouseEnter={() => glitchOnHover && setIsGlitching(true)}
      onMouseLeave={() => glitchOnHover && setIsGlitching(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Tag className="relative z-10">{text}</Tag>
      {isGlitching && (
        <>
          <Tag className="absolute inset-0 z-20" style={glitchLayer1Styles} aria-hidden>
            {text}
          </Tag>
          <Tag className="absolute inset-0 z-20" style={glitchLayer2Styles} aria-hidden>
            {text}
          </Tag>
        </>
      )}
    </motion.span>
  );
}
