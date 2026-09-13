'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

type NeonButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hideChevron?: boolean;
  className?: string;
  onClick?: () => void;
  intense?: boolean;
};

export default function NeonButton({
  href,
  children,
  variant = 'primary',
  icon,
  rightIcon,
  hideChevron = false,
  className = '',
  onClick,
  intense = false,
}: NeonButtonProps) {
  const baseStyles =
    'font-heading uppercase tracking-wider text-sm sm:text-base font-semibold inline-flex items-center gap-2 px-6 py-3.5 sm:px-7 sm:py-4 rounded-[14px] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black group relative overflow-hidden';

  const variants = {
    primary:
      'bg-gradient-to-r from-rave-red to-rave-red2 text-white hover:brightness-110',
    secondary:
      'bg-transparent border border-rave-red/60 text-white hover:bg-rave-red/10 hover:border-rave-red',
    ghost:
      'bg-transparent border border-white/10 text-white/80 hover:text-white hover:border-white/25 hover:bg-white/5',
  };

  const motionProps = {
    whileHover: {
      scale: 1.03,
      y: -2,
    },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  };

  // Enhanced content with intense effects
  const enhancedContent = (
    <>
      {/* Shimmer sweep effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={
          variant === 'primary'
            ? {
                backgroundPosition: ['200% center', '-200% center'],
              }
            : undefined
        }
        transition={
          variant === 'primary'
            ? { duration: 0.6, ease: 'easeInOut' }
            : undefined
        }
      />

      {/* Intense glow pulse for primary variant */}
      {variant === 'primary' && (
        <div className="absolute inset-0 pointer-events-none animate-border-glow rounded-[inherit]" />
      )}

      {/* Intense mode - extra glow layers */}
      {intense && variant === 'primary' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              boxShadow: '0 0 40px rgba(255, 23, 61, 0.5), 0 0 80px rgba(255, 23, 61, 0.3)',
              filter: 'blur(20px)',
            }}
          />
          <div
            className="absolute -inset-1 pointer-events-none rounded-[inherit] animate-pulse-scale opacity-50"
            style={{
              background: 'radial-gradient(circle, rgba(255, 23, 61, 0.3) 0%, transparent 70%)',
            }}
          />
        </>
      )}

      {/* Icon with rotation on hover */}
      <span className="relative z-10 flex items-center gap-2">
        {icon && (
          <motion.span
            className="flex-shrink-0"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.span>
        )}
        <span>{children}</span>
        {!hideChevron && (
          rightIcon ? (
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              {rightIcon}
            </motion.span>
          ) : (
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.span>
          )
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link
          href={href}
          className={`${baseStyles} ${variants[variant]} ${
            intense && variant === 'primary' ? 'btn-glow-intense' : ''
          } ${className}`}
        >
          {enhancedContent}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      {...motionProps}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${
        intense && variant === 'primary' ? 'btn-glow-intense' : ''
      } ${className}`}
    >
      {enhancedContent}
    </motion.button>
  );
}
