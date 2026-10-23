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
  highland: 'Highland — ice cyan (Hi-Land Tour)',
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
    accent: [85, 230, 242],
    accent2: [168, 243, 255],
    magenta: [47, 184, 255],
    purple: [28, 111, 209],
    blue: [143, 216, 255],
    strong: [21, 147, 184],
    tints: [[240, 252, 255], [200, 240, 255], [160, 228, 250], [190, 210, 255], [225, 245, 255]],
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
