'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Artwork for an archive entry.
 *
 * Deliberately drawn rather than photographic. The archive has no real
 * photography yet, and reusing a poster from another event — or dressing a
 * stock crowd shot up as documentation of a specific night — would present
 * invented history as a record. This reads as a graphic treatment instead.
 */
export default function ArchiveEventVisual({
  title,
  subtitle,
  label = 'ARCHIVE',
  size = 'card',
}: {
  title?: string;
  subtitle?: string;
  label?: string;
  size?: 'card' | 'feature';
}) {
  const reduced = useReducedMotion();
  const feature = size === 'feature';

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[#08080F]"
      style={{
        background:
          'radial-gradient(120% 95% at 50% 4%, rgba(255,23,61,0.26), transparent 58%), radial-gradient(95% 70% at 50% 100%, rgba(139,44,255,0.16), transparent 62%), #08080F',
      }}
    >
      {/* Light rig beams */}
      <div
        className="absolute inset-x-0 top-0 h-2/3 opacity-70"
        style={{
          background:
            'conic-gradient(from 198deg at 50% -8%, transparent 0deg, rgba(255,23,61,0.18) 10deg, transparent 22deg, transparent 38deg, rgba(255,23,61,0.14) 50deg, transparent 62deg, transparent 94deg, rgba(255,10,120,0.12) 106deg, transparent 118deg)',
        }}
      />

      {/* Connection ring */}
      <div className={`absolute inset-x-0 ${feature ? 'top-[38%]' : 'top-[30%]'} grid place-items-center`}>
        <motion.div
          className={`rounded-full border-2 border-rave-red/70 ${
            feature ? 'h-40 w-40 sm:h-52 sm:w-52' : 'h-20 w-20 sm:h-24 sm:w-24'
          }`}
          style={{ boxShadow: '0 0 30px rgba(255,23,61,0.5), inset 0 0 26px rgba(255,23,61,0.22)' }}
          animate={reduced ? undefined : { opacity: [0.75, 1, 0.75] }}
          transition={reduced ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Crowd silhouette */}
      <svg
        className={`absolute inset-x-0 bottom-0 w-full text-black ${feature ? 'h-2/5' : 'h-1/3'}`}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        <path d="M0 100V62c8-2 12-12 20-12s11 9 19 10 12-14 21-14 13 15 22 15 12-10 20-10 12 11 20 11 13-16 22-16 13 17 22 17 12-12 20-12 12 10 20 10 13-15 22-15 13 16 22 16 12-11 20-11 12 9 20 9 13-13 22-13 13 14 22 14 11-8 18-8v47z" />
        <circle cx="38" cy="58" r="7" />
        <circle cx="110" cy="54" r="7" />
        <circle cx="196" cy="57" r="8" />
        <circle cx="282" cy="53" r="7" />
        <circle cx="352" cy="59" r="7" />
      </svg>

      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,3,5,0.30) 0%, rgba(3,3,5,0) 34%, rgba(3,3,5,0.90) 100%)',
        }}
      />

      {/* Wordmark */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-5 text-center">
        {title && (
          <span
            className={`font-heading font-black uppercase leading-none tracking-[0.12em] text-white ${
              feature ? 'text-3xl sm:text-5xl' : 'text-lg sm:text-xl'
            }`}
            style={{ textShadow: '0 0 22px rgba(255,23,61,0.55)' }}
          >
            {title}
          </span>
        )}
        {subtitle && (
          <span
            className={`font-heading uppercase text-white/70 ${
              feature ? 'text-[11px] tracking-[0.34em] sm:text-sm' : 'text-[9px] tracking-[0.26em]'
            }`}
          >
            {subtitle}
          </span>
        )}
        {!title && (
          <span className="font-heading text-[10px] uppercase tracking-[0.34em] text-white/55 sm:text-xs">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
