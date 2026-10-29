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
  highland: 'Highland — poster blue (Hi-Land Tour)',
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
    accent: [42, 160, 223],
    accent2: [117, 201, 240],
    magenta: [21, 133, 213],
    purple: [28, 88, 156],
    blue: [157, 219, 241],
    strong: [24, 101, 149],
    tints: [[235, 247, 253], [190, 228, 248], [150, 208, 240], [175, 200, 240], [215, 238, 250]],
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
