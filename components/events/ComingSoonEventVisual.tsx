'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Stand-in artwork for events that have not been announced.
 *
 * Drawn rather than photographed on purpose: a placeholder card must not
 * borrow a real event's poster and read as a real line-up. The question mark
 * inside the Connection ring, plus the COMING SOON label, makes the state
 * obvious at a glance.
 */
export default function ComingSoonEventVisual({ label = 'COMING SOON' }: { label?: string }) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className="absolute inset-0 overflow-hidden bg-[#08080F]"
      style={{
        background:
          'radial-gradient(120% 90% at 50% 8%, rgba(255,23,61,0.22), transparent 58%), radial-gradient(90% 70% at 50% 100%, rgba(139,44,255,0.16), transparent 62%), #08080F',
      }}
    >
      {/* Light beams from the rig */}
      <div
        className="absolute inset-x-0 top-0 h-2/3 opacity-60"
        style={{
          background:
            'conic-gradient(from 200deg at 50% -10%, transparent 0deg, rgba(255,23,61,0.16) 12deg, transparent 24deg, transparent 40deg, rgba(255,23,61,0.12) 52deg, transparent 64deg, transparent 96deg, rgba(46,107,255,0.12) 108deg, transparent 120deg)',
        }}
      />

      {/* Connection ring with question mark */}
      <div className="absolute inset-0 grid place-items-center">
        <motion.div
          className="relative grid h-24 w-24 place-items-center rounded-full border-2 border-rave-red/70 sm:h-28 sm:w-28"
          style={{ boxShadow: '0 0 28px rgba(255,23,61,0.5), inset 0 0 22px rgba(255,23,61,0.22)' }}
          animate={reduced ? undefined : { opacity: [0.78, 1, 0.78] }}
          transition={reduced ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span
            className="font-heading text-4xl font-bold leading-none text-rave-red sm:text-5xl"
            style={{ textShadow: '0 0 18px rgba(255,23,61,0.6)' }}
          >
            ?
          </span>
        </motion.div>
      </div>

      {/* Crowd silhouette along the bottom edge */}
      <svg
        className="absolute inset-x-0 bottom-0 h-1/3 w-full text-black"
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
            'linear-gradient(180deg, rgba(3,3,5,0.25) 0%, rgba(3,3,5,0) 40%, rgba(3,3,5,0.88) 100%)',
        }}
      />

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-heading text-[10px] uppercase tracking-[0.34em] text-white/60 sm:text-xs">
        {label}
      </span>
    </div>
  );
}
