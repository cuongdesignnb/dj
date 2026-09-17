'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Shard {
  // Original triangle vertices (in canvas pixel space)
  ox1: number; oy1: number;
  ox2: number; oy2: number;
  ox3: number; oy3: number;
  // Center of mass (for rotation / translate)
  cx: number; cy: number;
  // Trigger x position (leftmost vertex x) — when beam passes, this shard "activates"
  triggerX: number;
  // Per-shard seeded velocity (deterministic for stable replay)
  vx: number;
  vy: number;
  vrot: number;
  // Highlight color tint (white/pink/purple)
  tint: string;
  // Radius for dust spawn
  size: number;
}

interface DustParticle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  tint: string;
}

interface DESTINYShatterProps {
  text?: string;
  fontSize?: number;
  className?: string;
  /** Loop duration in ms (default 8000) */
  cycleMs?: number;
  /** Beam width in px (the lighter "core" of the sweep) */
  beamWidth?: number;
  /** How far from the beam the fracture extends (px) */
  fractureRadius?: number;
  /** Max number of big shards */
  shardCount?: number;
  /** Max number of dust particles */
  dustCount?: number;
  /** Pause when out of viewport */
  pauseOffscreen?: boolean;
}

const PINK_TINTS = [
  'rgba(255, 240, 245, 1)',
  'rgba(255, 200, 225, 1)',
  'rgba(255, 170, 210, 1)',
  'rgba(230, 180, 255, 1)',
  'rgba(255, 220, 235, 1)',
];

const DUST_TINTS = [
  'rgba(255, 230, 245, 0.95)',
  'rgba(255, 180, 220, 0.9)',
  'rgba(220, 170, 255, 0.9)',
  'rgba(255, 200, 230, 0.85)',
];

// Simple seeded PRNG (mulberry32) — same input gives same sequence
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a text mask on an offscreen canvas: returns ImageData-like mask (1 where ink, 0 where paper)
function buildTextMask(
  text: string,
  fontSize: number,
  cssWidth: number,
  cssHeight: number,
): {
  mask: Uint8Array;
  width: number;
  height: number;
  bounds: { x: number; y: number; w: number; h: number };
} {
  // Use devicePixelRatio for sharp sampling but cap to 2 for perf
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.ceil(cssWidth * dpr);
  const H = Math.ceil(cssHeight * dpr);

  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { mask: new Uint8Array(W * H), width: W, height: H, bounds: { x: 0, y: 0, w: W, h: H } };
  }

  // Fill black bg (so ink is opaque)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Draw white text matching the live rendering: italic Oswald-ish fallback chain,
  // uppercase, bold/black, tracking-wider, leading tight.
  const fontPx = fontSize * dpr;
  ctx.fillStyle = '#fff';
  ctx.font = `italic 900 ${fontPx}px "Oswald", "Impact", "Arial Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // letter-spacing positive in CSS maps roughly to extra space; emulate with letterSpacing
  // (modern browsers support letterSpacing on ctx).
  try {
    (ctx as any).letterSpacing = `${fontPx * 0.02}px`;
  } catch {
    /* older browsers */
  }

  // Measure to vertically center
  const metrics = ctx.measureText(text.toUpperCase());
  const ascent = metrics.actualBoundingBoxAscent || fontPx * 0.85;
  const descent = metrics.actualBoundingBoxDescent || fontPx * 0.05;
  const textHeight = ascent + descent;
  const cx = W / 2;
  const cy = H / 2 + (ascent - descent) / 2 - (textHeight - fontPx) / 2;

  // Use save/restore for transform tilt if needed — keep neutral here
  ctx.save();
  ctx.translate(cx, cy);
  // Simulate italic via small skew (real Oswald is naturally italic when loaded)
  // Without guaranteed Oswald loaded, this gives a believable shape
  ctx.transform(1, 0, -0.1, 1, 0, 0);
  ctx.fillText(text.toUpperCase(), 0, 0);
  ctx.restore();

  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  const mask = new Uint8Array(W * H);

  // Compute bounding box of ink while building mask
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      // Red channel > threshold => ink
      if (data[idx] > 128) {
        mask[y * W + x] = 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no ink detected (font not loaded yet) — use full canvas as fallback
  if (maxX < minX || maxY < minY) {
    return { mask, width: W, height: H, bounds: { x: 0, y: 0, w: W, h: H } };
  }

  return {
    mask,
    width: W,
    height: H,
    bounds: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
  };
}

// Triangulate the mask into shards using a coarse Voronoi-like grid:
// Sample N random "seed points" inside the mask, then for each pixel assign
// to the nearest seed. Each seed's region becomes a polygon (extracted by
// scanning its pixels and convex-hulling the boundary). For perf we
// approximate each region as a triangle from the centroid + two extreme points.
function buildShards(
  mask: Uint8Array,
  W: number,
  H: number,
  bounds: { x: number; y: number; w: number; h: number },
  count: number,
  seed: number,
  sizeBias: 'edges' | 'uniform' = 'edges',
): Shard[] {
  const rng = mulberry32(seed);

  // 1. Sample seed points that lie on ink
  const seedPoints: { x: number; y: number }[] = [];
  let attempts = 0;
  const maxAttempts = count * 50;
  while (seedPoints.length < count && attempts < maxAttempts) {
    attempts++;
    let x: number, y: number;
    if (sizeBias === 'edges') {
      // Bias samples toward text edges by jittering inside bounds and only accepting
      // pixels that have at least one non-ink neighbor (i.e. edge pixel).
      x = bounds.x + Math.floor(rng() * bounds.w);
      y = bounds.y + Math.floor(rng() * bounds.h);
      const idx = y * W + x;
      if (mask[idx] !== 1) continue;
      const onEdge =
        (x > 0 && mask[idx - 1] === 0) ||
        (x < W - 1 && mask[idx + 1] === 0) ||
        (y > 0 && mask[idx - W] === 0) ||
        (y < H - 1 && mask[idx + W] === 0);
      if (!onEdge) continue;
    } else {
      x = bounds.x + Math.floor(rng() * bounds.w);
      y = bounds.y + Math.floor(rng() * bounds.h);
      if (mask[y * W + x] !== 1) continue;
    }
    seedPoints.push({ x, y });
  }

  if (seedPoints.length === 0) return [];

  // 2. For each pixel in mask, assign to nearest seed (coarse grid for speed)
  // Use a stride to accelerate: sample every STRIDE px, then for pixels in
  // between, run nearest seed on a small local set.
  const STRIDE = 6;
  const assignment = new Int32Array(W * H);
  assignment.fill(-1);

  const cellW = STRIDE;
  const cellH = STRIDE;
  const cellsX = Math.ceil(W / cellW);
  const cellsY = Math.ceil(H / cellH);

  // For very fast nearest-neighbor we bucket seeds into cells and only check
  // seeds in 3x3 neighboring cells.
  const cellOfSeed: { cx: number; cy: number }[] = seedPoints.map((p) => ({
    cx: Math.floor(p.x / cellW),
    cy: Math.floor(p.y / cellH),
  }));

  for (let cy = 0; cy < cellsY; cy++) {
    for (let cx = 0; cx < cellsX; cx++) {
      // Find seeds in 3x3 neighborhood
      const localSeeds: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= cellsX || ny >= cellsY) continue;
          for (let i = 0; i < seedPoints.length; i++) {
            if (cellOfSeed[i].cx === nx && cellOfSeed[i].cy === ny) {
              localSeeds.push(i);
            }
          }
        }
      }
      if (localSeeds.length === 0) continue;

      // For each ink pixel in this cell, find nearest seed
      const x0 = cx * cellW;
      const y0 = cy * cellH;
      const x1 = Math.min(W, x0 + cellW);
      const y1 = Math.min(H, y0 + cellH);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = y * W + x;
          if (mask[idx] !== 1) continue;
          let best = -1;
          let bestDist = Infinity;
          for (let i = 0; i < localSeeds.length; i++) {
            const s = seedPoints[localSeeds[i]];
            const dx = x - s.x;
            const dy = y - s.y;
            const d = dx * dx + dy * dy;
            if (d < bestDist) {
              bestDist = d;
              best = localSeeds[i];
            }
          }
          assignment[idx] = best;
        }
      }
    }
  }

  // 3. For each seed, compute centroid + convex hull of assigned pixels => polygon
  const shards: Shard[] = [];
  const tintOptions = PINK_TINTS;

  for (let i = 0; i < seedPoints.length; i++) {
    let sumX = 0,
      sumY = 0,
      count = 0;
    let minPx = W,
      minPy = H,
      maxPx = 0,
      maxPy = 0;
    let rightMostX = -1,
      rightMostY = 0,
      leftMostX = W,
      leftMostY = 0,
      topMostY = H,
      topMostX = 0,
      bottomMostY = 0,
      bottomMostX = 0;

    for (let y = bounds.y; y < bounds.y + bounds.h; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.w; x++) {
        if (assignment[y * W + x] !== i) continue;
        sumX += x;
        sumY += y;
        count++;
        if (x < minPx) minPx = x;
        if (y < minPy) minPy = y;
        if (x > maxPx) maxPx = x;
        if (y > maxPy) maxPy = y;
        if (x > rightMostX) {
          rightMostX = x;
          rightMostY = y;
        }
        if (x < leftMostX) {
          leftMostX = x;
          leftMostY = y;
        }
        if (y < topMostY) {
          topMostY = y;
          topMostX = x;
        }
        if (y > bottomMostY) {
          bottomMostY = y;
          bottomMostX = x;
        }
      }
    }

    if (count === 0) continue;

    const cx = sumX / count;
    const cy = sumY / count;

    // Triangle approximation: use centroid + two extreme points to form a
    // recognizable shard. Pick leftMostX and rightMostX as the other two
    // vertices for an elongated shape, falling back to top/bottom.
    const v1x = leftMostX;
    const v1y = leftMostY;
    const v2x = rightMostX;
    const v2y = rightMostY;
    // Third vertex: top or bottom extreme depending on which is further from centroid
    const useTop = Math.abs(topMostY - cy) > Math.abs(bottomMostY - cy);
    const v3x = useTop ? topMostX : bottomMostX;
    const v3y = useTop ? topMostY : bottomMostY;

    // Seeded per-shard velocity (deterministic)
    const angle = rng() * Math.PI * 2;
    const speed = 0.5 + rng() * 1.5; // px / progress unit
    const vx = Math.cos(angle) * speed * 30;
    const vy = Math.sin(angle) * speed * 30 - 10; // slight upward bias
    const vrot = (rng() - 0.5) * 8; // rad per progress unit

    shards.push({
      ox1: v1x, oy1: v1y,
      ox2: v2x, oy2: v2y,
      ox3: v3x, oy3: v3y,
      cx, cy,
      triggerX: Math.min(v1x, v2x, v3x),
      vx, vy, vrot,
      tint: tintOptions[Math.floor(rng() * tintOptions.length)],
      size: Math.max(maxPx - minPx, maxPy - minPy),
    });
  }

  return shards;
}

export default function DESTINYShatter({
  text = 'EVENT',
  fontSize = 200,
  className = '',
  cycleMs = 8000,
  beamWidth = 28,
  fractureRadius = 90,
  shardCount = 28,
  dustCount = 70,
  pauseOffscreen = true,
}: DESTINYShatterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLElement>(null);
  const [showFallback, setShowFallback] = useState(true);

  // Keep latest settings accessible inside the animation loop without re-binding
  const settingsRef = useRef({
    cycleMs,
    beamWidth,
    fractureRadius,
    dustCount,
    pauseOffscreen,
  });
  settingsRef.current = { cycleMs, beamWidth, fractureRadius, dustCount, pauseOffscreen };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    if (!container || !canvas) return;

    // Skip entirely if user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setShowFallback(true);
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setShowFallback(true);
      canvas.style.display = 'none';
      return;
    }

    let raf = 0;
    let shards: Shard[] = [];
    let mask: Uint8Array | null = null;
    let maskW = 0;
    let maskH = 0;
    let maskBounds = { x: 0, y: 0, w: 0, h: 0 };
    let dpr = 1;
    let cssWidth = 0;
    let cssHeight = 0;

    let dust: DustParticle[] = [];
    let progressStart = 0;
    let visible = true;
    let running = true;

    const measure = () => {
      // Measure based on fallback's actual rendered size (it has the real font)
      const rect = fallback!.getBoundingClientRect();
      cssWidth = Math.max(1, Math.ceil(rect.width));
      cssHeight = Math.max(1, Math.ceil(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(cssWidth * dpr);
      canvas.height = Math.ceil(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    };

    const rebuildMaskAndShards = () => {
      measure();

      // Build mask using the same font/size as the live element. We pull
      // the computed font-size from the fallback so the mask matches.
      const computed = window.getComputedStyle(fallback!);
      const fs = parseFloat(computed.fontSize) || fontSize;
      // Ensure web font is loaded before masking
      const docFonts = (document as any).fonts;
      const ready = docFonts && docFonts.ready ? docFonts.ready : Promise.resolve();

      ready
        .then(() => {
          // Re-measure after font swap (size could change)
          measure();
          const fs2 = parseFloat(window.getComputedStyle(fallback!).fontSize) || fs;
          const built = buildTextMask(text, fs2, cssWidth, cssHeight);
          mask = built.mask;
          maskW = built.width;
          maskH = built.height;
          maskBounds = built.bounds;

          // Reduce shards on small screens
          const isMobile = window.innerWidth < 640;
          const targetCount = isMobile ? Math.floor(shardCount * 0.6) : shardCount;
          shards = buildShards(mask, maskW, maskH, maskBounds, targetCount, 1337, 'edges');

          // Pre-fill dust pool
          dust = [];
          for (let i = 0; i < settingsRef.current.dustCount; i++) {
            dust.push({
              x: 0, y: 0, vx: 0, vy: 0,
              life: 0, maxLife: 1, size: 1, tint: DUST_TINTS[0],
            });
          }

          setShowFallback(false);
        })
        .catch(() => {
          setShowFallback(true);
        });
    };

    const draw = (now: number) => {
      if (!running || !visible || !mask || shards.length === 0) {
        raf = requestAnimationFrame(draw);
        return;
      }

      const { cycleMs, beamWidth, fractureRadius } = settingsRef.current;
      const t = ((now - progressStart) % cycleMs) / cycleMs; // 0..1
      const cycleT = t; // 0..1

      // Layout timeline (matches spec):
      // 0.00–0.125 : idle / pristine (0–1s of 8s)
      // 0.125–0.44 : beam sweep (1–3.5s)
      // 0.44–0.56  : drift (3.5–4.5s)
      // 0.56–0.75  : reconcile (4.5–6s)
      // 0.75–1.00  : hold + fade in for next cycle
      let beamX = -beamWidth; // CSS px from left of canvas
      let beamAlpha = 0;
      let fractureAmt = 0; // 0 = intact, 1 = max fracture
      let reconcileAmt = 0; // 0 = drift pose, 1 = back at origin

      if (cycleT < 0.125) {
        // Idle — beam hidden, all intact
        beamX = -beamWidth;
      } else if (cycleT < 0.44) {
        // Sweep beam from left to right
        const u = (cycleT - 0.125) / (0.44 - 0.125); // 0..1
        beamX = u * cssWidth + beamWidth * 0.5;
        beamAlpha = 1;
        fractureAmt = Math.min(1, u * 1.1);
      } else if (cycleT < 0.56) {
        // Drift: beam at far right, fracture at max
        beamX = cssWidth + beamWidth;
        beamAlpha = 0;
        fractureAmt = 1;
        // During drift, reconcile starts from 0 → small portion
        reconcileAmt = (cycleT - 0.44) / (0.56 - 0.44) * 0.15;
      } else if (cycleT < 0.75) {
        // Reconcile: shards glide back to origin
        beamX = cssWidth + beamWidth;
        beamAlpha = 0;
        fractureAmt = 1;
        reconcileAmt = (cycleT - 0.56) / (0.75 - 0.56);
      } else {
        // Hold + fade
        beamX = cssWidth + beamWidth;
        beamAlpha = 0;
        fractureAmt = 1;
        reconcileAmt = 1;
      }

      // === Render ===

      // Clear (transparent — sits over the DOM fallback while it exists)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // 1. Draw pristine text body using the SAME mask so we never have
      //    double-layered letters. Only draw fragments behind the beam.
      drawTextBody(ctx, mask, maskW, maskH, beamX, beamWidth);

      // 2. Draw fractured shards to the right of the beam contact line
      drawShards(ctx, shards, beamX, beamWidth, fractureRadius, fractureAmt, reconcileAmt, dust);

      // 3. Draw the beam itself (light sweep)
      drawBeam(ctx, beamX, cssHeight, beamWidth, beamAlpha);

      raf = requestAnimationFrame(draw);
    };

    const drawTextBody = (
      ctx: CanvasRenderingContext2D,
      mask: Uint8Array,
      W: number,
      H: number,
      beamX: number,
      beamWidth: number,
    ) => {
      // The beam "passes" pixels with center x in [beamX - beamWidth/2, beamX + beamWidth/2]
      const beamLeft = beamX - beamWidth * 0.5;
      const beamRight = beamX + beamWidth * 0.5;

      // Render body using ImageData of mask. Pixels to the LEFT of the beam
      // (and outside the fracture halo) are drawn intact. Pixels in/right
      // of the beam contact are left for shards to fill.

      // Build image from mask — fill intact region only.
      const img = ctx.createImageData(W, H);
      const data = img.data;
      // Pre-compute contact threshold in mask pixel space
      const contactMaskX = Math.round((beamRight / cssWidth) * W);

      // Alpha: 255 for fully intact, 0 for under-beam or beyond
      // Within fracture halo to the right of beam, partial alpha
      const fadeWidthPx = beamWidth * 3.5;
      const fadeStartPx = beamX + beamWidth * 0.5;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const idx = y * W + x;
          if (mask[idx] !== 1) continue;

          let alpha: number;
          if (x <= contactMaskX) {
            alpha = 255; // fully intact (left of beam)
          } else {
            // inside fracture fade zone
            const fadeX = ((x - contactMaskX) / W) * cssWidth;
            if (fadeX >= fadeWidthPx) {
              alpha = 0; // shards take over
            } else {
              alpha = Math.round(255 * (1 - fadeX / fadeWidthPx));
            }
          }

          if (alpha <= 0) continue;
          const di = idx * 4;
          data[di] = 255;     // R
          data[di + 1] = 240; // G (slightly warm)
          data[di + 2] = 250; // B
          data[di + 3] = alpha;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const drawShards = (
      ctx: CanvasRenderingContext2D,
      shards: Shard[],
      beamX: number,
      beamWidth: number,
      fractureRadius: number,
      fractureAmt: number,
      reconcileAmt: number,
      dustRef: DustParticle[],
    ) => {
      // Convert beam to mask-pixel space for trigger comparison
      const beamMaskX = (beamX / cssWidth) * maskW;
      const fractureMaskRadius = (fractureRadius / cssWidth) * maskW;

      ctx.save();

      for (let i = 0; i < shards.length; i++) {
        const s = shards[i];
        // Activation: how much the beam has "passed" this shard.
        // We define activation as 0 when beam is to the left of shard,
        // and ramps to 1 as beam passes through it.
        // For the sweep phase, beams left->right trigger shards in order.
        const dist = s.triggerX - beamMaskX;
        let localFracture: number;
        if (dist > fractureMaskRadius) {
          localFracture = 0; // beam hasn't reached this shard yet
        } else if (dist < -fractureMaskRadius * 1.5) {
          localFracture = 1; // beam long past — fully fractured (capped)
        } else {
          // Smooth ramp around contact
          localFracture = 1 - (dist + fractureMaskRadius) / (fractureMaskRadius * 2.5);
          localFracture = Math.max(0, Math.min(1, localFracture));
        }

        const eff = localFracture * fractureAmt;

        if (eff <= 0.01 && reconcileAmt >= 0.999) {
          // Pristine — nothing to draw (body already shows it)
          continue;
        }

        // Reconcile: ease back to origin
        // When reconcile < 1, draw shard offset by velocity * (1 - reconcile)
        // And faded out toward the middle of the fracture window.
        const drift = 1 - reconcileAmt; // 1 = fully drifting, 0 = home

        // Per-shard displacement in canvas-px (note: mask is in dpr px; convert back)
        const px = (x: number) => (x / dpr);
        const py = (y: number) => (y / dpr);

        // A "burst" intensity that swells and decays during the burst window
        // Use sin curve so shards fly out then fall back
        const burst = Math.sin(eff * Math.PI); // 0..1..0 across the fracture window

        const dx = s.vx * burst * drift;
        const dy = s.vy * burst * drift - 30 * Math.pow(burst, 1.5) * drift; // gravity-ish dip then up
        const rot = s.vrot * burst * drift;

        // Convert mask vertices to CSS px space
        const x1 = px(s.ox1) + dx;
        const y1 = py(s.oy1) + dy;
        const x2 = px(s.ox2) + dx;
        const y2 = px(s.oy2) + dy;
        const x3 = px(s.ox3) + dx;
        const y3 = px(s.oy3) + dy;

        // Alpha: shards become visible as beam passes; fade during reconcile
        let alpha = eff;
        if (reconcileAmt > 0) alpha = Math.min(alpha, 1 - reconcileAmt * 0.4);
        if (alpha <= 0.02) continue;
        ctx.globalAlpha = alpha;

        // Build a parallelogram-ish shape with the centroid for better fit
        const cx = px(s.cx) + dx;
        const cy = py(s.cy) + dy;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.translate(-cx, -cy);
        // Soft fill (pinkish-white)
        ctx.fillStyle = s.tint;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();

        // Edge highlight
        ctx.strokeStyle = 'rgba(255, 220, 240, 0.7)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Occasional bright speck on a random vertex to suggest a faceted edge
        if (burst > 0.6) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(x1, y1, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Spawn dust when burst peaks
        if (burst > 0.85 && Math.random() < 0.35) {
          const px2 = (s.ox1 + s.ox2 + s.ox3) / 3 / dpr + dx;
          const py2 = (s.oy1 + s.oy2 + s.oy3) / 3 / dpr + dy;
          for (let k = 0; k < 2; k++) {
            const d = dustRef[Math.floor(Math.random() * dustRef.length)];
            if (d.life > 0) continue;
            d.x = px2 + (Math.random() - 0.5) * s.size * 0.6;
            d.y = py2 + (Math.random() - 0.5) * s.size * 0.6;
            const ang = Math.random() * Math.PI * 2;
            const sp = 0.6 + Math.random() * 1.6;
            d.vx = Math.cos(ang) * sp;
            d.vy = Math.sin(ang) * sp - 1;
            d.maxLife = 0.4 + Math.random() * 0.4;
            d.life = d.maxLife;
            d.size = 0.6 + Math.random() * 1.6;
            d.tint = DUST_TINTS[Math.floor(Math.random() * DUST_TINTS.length)];
          }
        }
      }
      ctx.restore();

      // Render & advance dust
      ctx.save();
      for (let i = 0; i < dustRef.length; i++) {
        const d = dustRef[i];
        if (d.life <= 0) continue;
        const tNorm = d.life / d.maxLife;
        ctx.globalAlpha = Math.min(1, tNorm * 1.5);
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.08; // gravity
        d.vx *= 0.99;
        d.life -= 1 / 60;
        ctx.fillStyle = d.tint;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    };

    const drawBeam = (
      ctx: CanvasRenderingContext2D,
      beamX: number,
      height: number,
      beamWidth: number,
      alpha: number,
    ) => {
      if (alpha <= 0) return;
      ctx.save();

      // Slight diagonal angle: rotate around beam center
      const angleDeg = 8;
      const rad = (angleDeg * Math.PI) / 180;
      const cx = beamX;
      const cy = height / 2;

      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.translate(-cx, -cy);

      // Outer halo (wide, soft pink)
      const haloWidth = beamWidth * 6;
      const haloGrad = ctx.createLinearGradient(beamX - haloWidth / 2, 0, beamX + haloWidth / 2, 0);
      haloGrad.addColorStop(0, 'rgba(255, 80, 180, 0)');
      haloGrad.addColorStop(0.45, 'rgba(255, 130, 210, 0.15)');
      haloGrad.addColorStop(0.5, 'rgba(255, 180, 230, 0.35)');
      haloGrad.addColorStop(0.55, 'rgba(255, 130, 210, 0.15)');
      haloGrad.addColorStop(1, 'rgba(255, 80, 180, 0)');
      ctx.fillStyle = haloGrad;
      ctx.globalAlpha = alpha;
      ctx.fillRect(beamX - haloWidth / 2, 0, haloWidth, height);

      // Inner pink glow
      const glowWidth = beamWidth * 2.5;
      const glowGrad = ctx.createLinearGradient(beamX - glowWidth / 2, 0, beamX + glowWidth / 2, 0);
      glowGrad.addColorStop(0, 'rgba(255, 100, 180, 0)');
      glowGrad.addColorStop(0.5, 'rgba(255, 180, 230, 0.7)');
      glowGrad.addColorStop(1, 'rgba(255, 100, 180, 0)');
      ctx.fillStyle = glowGrad;
      ctx.globalAlpha = alpha;
      ctx.fillRect(beamX - glowWidth / 2, 0, glowWidth, height);

      // Bright core
      const coreWidth = beamWidth;
      const coreGrad = ctx.createLinearGradient(beamX - coreWidth / 2, 0, beamX + coreWidth / 2, 0);
      coreGrad.addColorStop(0, 'rgba(255, 220, 240, 0)');
      coreGrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      coreGrad.addColorStop(1, 'rgba(255, 220, 240, 0)');
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = alpha;
      ctx.fillRect(beamX - coreWidth / 2, 0, coreWidth, height);

      // Drop shadow / glow filter via composite
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = alpha * 0.6;
      const screenGrad = ctx.createLinearGradient(beamX - coreWidth, 0, beamX + coreWidth, 0);
      screenGrad.addColorStop(0, 'rgba(255, 180, 230, 0)');
      screenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
      screenGrad.addColorStop(1, 'rgba(255, 180, 230, 0)');
      ctx.fillStyle = screenGrad;
      ctx.fillRect(beamX - coreWidth, 0, coreWidth * 2, height);

      ctx.restore();
    };

    // IntersectionObserver to pause when offscreen
    let io: IntersectionObserver | null = null;
    const onVisibilityChange = () => {
      visible = !document.hidden;
    };

    io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { threshold: 0.05 },
    );
    io.observe(container);

    document.addEventListener('visibilitychange', onVisibilityChange);

    // Rebuild mask on font ready / resize
    let resizeTimer: number | null = null;
    const onResize = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        rebuildMaskAndShards();
      }, 150);
    };
    window.addEventListener('resize', onResize);

    // Initial build
    rebuildMaskAndShards();

    // Start loop only after mask is ready (small delay for font load)
    progressStart = performance.now();

    // Hook up font ready to reset start so the cycle starts after mask builds
    const docFonts = (document as any).fonts;
    if (docFonts && docFonts.ready) {
      docFonts.ready.then(() => {
        progressStart = performance.now();
      });
    }

    raf = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (io) io.disconnect();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (resizeTimer) window.clearTimeout(resizeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, fontSize]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ lineHeight: 0.8 }}
    >
      {/* Fallback / live heading for accessibility & layout */}
      <span
        ref={fallbackRef as React.RefObject<HTMLSpanElement>}
        className="font-heading font-black uppercase leading-[0.8] tracking-wider text-white italic pointer-events-none"
        style={{
          fontSize: 'inherit',
          opacity: showFallback ? 1 : 0,
          textShadow:
            '0 0 18px rgba(255, 23, 61, 0.5), 0 0 36px rgba(255, 23, 61, 0.35)',
          WebkitTextStroke: '0px',
          margin: 0,
        }}
        aria-label={text}
      >
        {text}
      </span>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ width: '100%', height: '100%' }}
        aria-hidden
      />
    </div>
  );
}
