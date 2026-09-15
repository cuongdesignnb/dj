'use client';

/**
 * Drawn stand-in for a bottle.
 *
 * No product photography exists in this repo for the six choices, and pulling
 * branded imagery off the web into the source tree is not something to do
 * unasked. This reads as an illustration, tinted per bottle so the row is still
 * scannable.
 */
export default function BottleVisual({ tint, name }: { tint: string; name: string }) {
  return (
    <svg
      viewBox="0 0 60 150"
      role="img"
      aria-label={`${name} bottle illustration`}
      className="h-full w-auto"
    >
      <defs>
        <linearGradient id={`glass-${tint.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={tint} stopOpacity="0.55" />
          <stop offset="35%" stopColor={tint} stopOpacity="0.95" />
          <stop offset="70%" stopColor={tint} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {/* Neck and shoulder */}
      <path
        d="M24 10 h12 v24 c0 6 10 12 10 24 v72 c0 6 -4 10 -10 10 h-12 c-6 0 -10 -4 -10 -10 v-72 c0 -12 10 -18 10 -24 z"
        fill={`url(#glass-${tint.replace('#', '')})`}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />

      {/* Cap */}
      <rect x="23" y="4" width="14" height="9" rx="2" fill="#15151C" stroke="rgba(255,255,255,0.2)" />

      {/* Label band */}
      <rect
        x="15"
        y="78"
        width="30"
        height="34"
        rx="3"
        fill="rgba(6,6,10,0.72)"
        stroke="rgba(255,255,255,0.18)"
      />

      {/* Highlight */}
      <rect x="20" y="46" width="4" height="70" rx="2" fill="rgba(255,255,255,0.22)" />
    </svg>
  );
}
