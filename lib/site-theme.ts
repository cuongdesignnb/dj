/**
 * Public site colour themes, chosen in Admin › Settings › Site. CSS reads the
 * same values from app/globals.css (`[data-theme]` on <html>); this palette is
 * for code that needs literal colours (canvas, Motion colour animations).
 */
export const SITE_THEMES = ['connection', 'highland'] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];
export const DEFAULT_SITE_THEME: SiteTheme = 'connection';

export const SITE_THEME_LABELS: Record<SiteTheme, string> = {
  connection: 'Connection — neon red (current)',
  highland: 'Electric Blue × Liquid Chrome',
};

type Rgb = readonly [number, number, number];

export interface SitePalette {
  accent: Rgb;
  accent2: Rgb;
  magenta: Rgb;
  purple: Rgb;
  blue: Rgb;
  /** Solid card fill (the highlighted ticket tier). */
  strong: Rgb;
  /** Soft highlight tints for the hero particles. */
  tints: readonly Rgb[];
}

export const SITE_PALETTES: Record<SiteTheme, SitePalette> = {
  connection: {
    accent: [255, 23, 61],
    accent2: [255, 48, 79],
    magenta: [255, 10, 120],
    purple: [139, 44, 255],
    blue: [46, 107, 255],
    strong: [227, 28, 53],
    tints: [[255, 240, 245], [255, 200, 225], [255, 170, 210], [230, 180, 255], [255, 220, 235]],
  },
  highland: {
    accent: [4, 184, 252],
    accent2: [112, 217, 255],
    magenta: [0, 108, 168],
    purple: [0, 108, 168],
    blue: [196, 208, 220],
    strong: [0, 108, 168],
    tints: [[245, 250, 255], [229, 246, 255], [196, 208, 220], [112, 217, 255], [137, 155, 170]],
  },
};

export function normaliseTheme(value: unknown): SiteTheme {
  return typeof value === 'string' && (SITE_THEMES as readonly string[]).includes(value) ? value as SiteTheme : DEFAULT_SITE_THEME;
}

export function rgba([r, g, b]: Rgb, alpha = 1): string {
  return alpha >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
