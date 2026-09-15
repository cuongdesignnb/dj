'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { VipBooth } from '@/lib/vip/types';
import { vipReveal, vipStagger } from '@/lib/animations';

/**
 * Illustrative club map with selectable booths.
 *
 * Drawn in CSS rather than overlaid on `/assets/club-map.jpg`: nothing verifies
 * that raster against the real venue, so hotspots pinned to it would imply a
 * precision this does not have. The disclaimer under the map says as much, and
 * the booth chips below it give a full-size target on touch screens.
 */
export default function ClubMap({
  booths,
  selectedBoothId,
  onSelect,
  disclaimer,
}: {
  booths: VipBooth[];
  selectedBoothId: string | null;
  onSelect(boothId: string): void;
  disclaimer: string;
}) {
  const reduced = useReducedMotion();

  const availabilityNote = (booth: VipBooth) =>
    booth.availability === 'on-request' ? 'availability on request' : booth.availability;

  return (
    <div>
      <motion.div
        variants={vipReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="relative overflow-hidden rounded-[18px] border border-white/[0.08] bg-[#07070D] p-4 sm:p-6"
      >
        {/* The plan itself is decorative; the booth buttons carry the meaning. */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
          <div aria-hidden className="absolute inset-0">
            {/* Stage */}
            <div
              className="absolute left-1/2 top-[3%] h-[13%] w-[42%] -translate-x-1/2 rounded-b-[18px] border border-rave-red/50 bg-rave-red/[0.07]"
              style={{ boxShadow: '0 0 30px rgba(255,23,61,0.28)' }}
            >
              <span className="grid h-full place-items-center font-heading text-[10px] uppercase tracking-[0.3em] text-white sm:text-xs">
                Stage
              </span>
            </div>

            {/* Dance floor */}
            <div className="absolute left-[24%] top-[22%] h-[48%] w-[52%] rounded-[12px] border border-white/[0.06] bg-white/[0.015]">
              <span className="grid h-full place-items-center font-heading text-[9px] uppercase tracking-[0.3em] text-rave-muted sm:text-[11px]">
                Dance Floor
              </span>
            </div>

            {/* Zone labels */}
            <span className="absolute left-[2%] top-[42%] font-heading text-[8px] uppercase leading-tight tracking-[0.2em] text-rave-muted sm:text-[10px]">
              VIP
              <br />
              Left
            </span>
            <span className="absolute right-[2%] top-[42%] text-right font-heading text-[8px] uppercase leading-tight tracking-[0.2em] text-rave-muted sm:text-[10px]">
              VIP
              <br />
              Right
            </span>
            <span className="absolute bottom-[3%] left-1/2 -translate-x-1/2 font-heading text-[8px] uppercase tracking-[0.2em] text-rave-muted sm:text-[10px]">
              VIP Front
            </span>

            {/* Bar + DJ booth */}
            <div className="absolute bottom-[10%] left-[3%] h-[16%] w-[17%] rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
              <span className="grid h-full place-items-center font-heading text-[9px] uppercase tracking-[0.2em] text-rave-muted sm:text-[11px]">
                Bar
              </span>
            </div>
            <div className="absolute bottom-[10%] right-[3%] h-[16%] w-[17%] rounded-[10px] border border-white/[0.06] bg-white/[0.02]">
              <span className="grid h-full place-items-center text-center font-heading text-[9px] uppercase leading-tight tracking-[0.2em] text-rave-muted sm:text-[11px]">
                DJ
                <br />
                Booth
              </span>
            </div>
          </div>

          {/*
            Hotspots only where they can be a comfortable size without colliding.
            Below lg the map is illustrative and the chips underneath are the
            control — `hidden` keeps these out of the tab order and a11y tree
            entirely, so there is never a duplicate set of targets.
          */}
          <motion.div
            variants={vipStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="absolute inset-0 hidden lg:block"
          >
            {booths.map((booth) => {
              const selected = booth.id === selectedBoothId;
              return (
                <motion.button
                  key={booth.id}
                  variants={vipReveal}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Booth ${booth.label}, ${booth.zone} zone, ${availabilityNote(booth)}`}
                  disabled={!booth.requestable}
                  onClick={() => onSelect(booth.id)}
                  whileHover={reduced ? undefined : { scale: 1.06 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                  style={{ left: `${booth.x}%`, top: `${booth.y}%` }}
                  // 44px minimum so the hotspots stay tappable, not just the
                  // chips below the map.
                  className={`absolute grid min-h-[44px] min-w-[44px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[8px] border px-2 font-heading text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-xs ${
                    selected
                      ? 'border-rave-red bg-rave-red/25 text-white shadow-[0_0_20px_rgba(255,23,61,0.55)]'
                      : 'border-rave-red/40 bg-black/50 text-white/85 hover:border-rave-red hover:bg-rave-red/10'
                  }`}
                >
                  {booth.label}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        <p className="mt-4 text-xs text-rave-muted/70">{disclaimer}</p>
      </motion.div>

      {/* The booth control below lg, where the map hotspots are hidden. */}
      <div className="mt-5 lg:hidden">
        <p id="booth-chips-label" className="font-heading text-[11px] uppercase tracking-[0.2em] text-rave-muted">
          Select a booth
        </p>
        <div
          role="group"
          aria-labelledby="booth-chips-label"
          className="mt-3 flex flex-wrap gap-2"
        >
          {booths.map((booth) => {
            const selected = booth.id === selectedBoothId;
            return (
              <button
                key={booth.id}
                type="button"
                aria-pressed={selected}
                aria-label={`Booth ${booth.label}, ${availabilityNote(booth)}`}
                disabled={!booth.requestable}
                onClick={() => onSelect(booth.id)}
                className={`min-h-[44px] min-w-[56px] rounded-[12px] border px-4 font-heading text-sm font-bold uppercase tracking-[0.1em] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red focus-visible:ring-offset-2 focus-visible:ring-offset-rave-black disabled:opacity-40 ${
                  selected
                    ? 'border-rave-red bg-rave-red/20 text-white'
                    : 'border-white/[0.12] bg-white/[0.03] text-rave-muted hover:border-rave-red/50 hover:text-white'
                }`}
              >
                {booth.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
