import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { db } from '@/server/db/client';
import { runtimeConfig } from '@/server/config';
import { DEFAULT_SITE_BRANDING, normaliseBranding } from '@/lib/site-branding';
import { safeImageSrc, type EmailSettings } from '@/lib/email/smtp-config';
import type { EmailBrand } from '@/lib/email/templates';

// The header logo of every email. Email clients do not show SVG, so the logo
// (Email logo from Admin, else the site logo) is rendered to a PNG with sharp
// and sent inline (cid). If that fails, templates show the site name instead.

export const LOGO_CID = 'site-logo@connection-email';
const MAX_BYTES = 5 * 1024 * 1024;
const CACHE_MS = 10 * 60 * 1000;

export interface InlineAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
  cid: string;
}

let cache: { src: string; at: number; png: { buffer: Buffer; width: number; height: number } | null } | null = null;

function siteUrl() {
  return runtimeConfig().appUrl.replace(/\/$/, '');
}

async function readBytes(src: string): Promise<Buffer | null> {
  if (src.startsWith('/') && !src.startsWith('/api/')) {
    // Bundled files in public/ (e.g. /assets/logo-connection.svg).
    const publicDir = path.resolve(process.cwd(), 'public');
    const file = path.resolve(publicDir, `.${decodeURIComponent(src.split(/[?#]/)[0])}`);
    if (!file.startsWith(publicDir + path.sep)) return null;
    const bytes = await readFile(file).catch(() => null);
    if (bytes) return bytes.byteLength <= MAX_BYTES ? bytes : null;
  }
  // Uploaded media is served by this app; ask it directly rather than through the internet.
  const url = src.startsWith('/') ? `http://127.0.0.1:${process.env.PORT || 3000}${src}` : src;
  const response = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: 'follow' }).catch(() => null);
  if (!response?.ok) return null;
  const length = Number(response.headers.get('content-length') ?? 0);
  if (length > MAX_BYTES) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  return bytes.byteLength <= MAX_BYTES ? bytes : null;
}

/** PNG at 2× for sharp screens; shown at half size. Null when it cannot be drawn or comes out blank. */
async function rasterise(bytes: Buffer, isSvg: boolean) {
  try {
    const sharp = (await import('sharp')).default;
    const { data, info } = await sharp(bytes, isSvg ? { density: 288 } : {})
      .resize({ width: 480, height: 120, fit: 'inside', withoutEnlargement: !isSvg })
      .png()
      .toBuffer({ resolveWithObject: true });
    const stats = await sharp(data).stats();
    const alpha = stats.channels[3];
    if (alpha && alpha.max === 0) return null;
    return { buffer: data, width: Math.max(1, Math.round(info.width / 2)), height: Math.max(1, Math.round(info.height / 2)) };
  } catch (error) {
    console.error('[mail] logo could not be drawn', error instanceof Error ? error.message : error);
    return null;
  }
}

async function logoPng(src: string) {
  if (cache && cache.src === src && Date.now() - cache.at < CACHE_MS) return cache.png;
  const bytes = await readBytes(src).catch(() => null);
  const isSvg = /\.svg(?:$|[?#])/i.test(src) || Boolean(bytes && /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(bytes.subarray(0, 512).toString('utf8')));
  const png = bytes ? await rasterise(bytes, isSvg) : null;
  cache = { src, at: Date.now(), png };
  return png;
}

const SOCIALS: Array<[key: string, label: string]> = [['social.instagram', 'Instagram'], ['social.facebook', 'Facebook'], ['social.tiktok', 'TikTok'], ['social.youtube', 'YouTube'], ['social.spotify', 'Spotify']];

/** Site name, logo, contact email and social links for email templates. */
export async function loadEmailBrand(settings: Pick<EmailSettings, 'emailLogo'>): Promise<{ brand: EmailBrand; attachments: InlineAttachment[] }> {
  const rows = await db.siteSetting
    .findMany({ where: { key: { in: ['site.name', 'site.logo', 'contact.email', ...SOCIALS.map(([key]) => key)] } }, select: { key: true, valueJson: true } })
    .catch(() => []);
  const value = (key: string) => rows.find((row) => row.key === key)?.valueJson ?? null;
  const branding = normaliseBranding({ logo: value('site.logo'), favicon: null, name: value('site.name') });
  const src = safeImageSrc(settings.emailLogo?.src) ?? branding.logo.src ?? DEFAULT_SITE_BRANDING.logo.src;
  const png = await logoPng(src);
  const contact = value('contact.email');
  const brand: EmailBrand = {
    siteName: branding.name,
    siteUrl: siteUrl(),
    logo: png ? { cid: LOGO_CID, width: png.width, height: png.height, alt: settings.emailLogo?.alt || branding.logo.alt || branding.name } : null,
    contactEmail: typeof contact === 'string' && contact.includes('@') ? contact.trim() : null,
    socials: SOCIALS.flatMap(([key, label]) => {
      const href = value(key);
      return typeof href === 'string' && /^https:\/\//i.test(href.trim()) ? [{ label, href: href.trim() }] : [];
    }),
  };
  return { brand, attachments: png ? [{ filename: 'logo.png', content: png.buffer, contentType: 'image/png', cid: LOGO_CID }] : [] };
}

/** Absolute https URL for an image on this site, or null (emails cannot load relative or local paths). */
export function absoluteImage(src: string | null | undefined): string | null {
  if (!src) return null;
  if (/\.svg(?:$|[?#])/i.test(src)) return null;
  const url = src.startsWith('/') ? `${siteUrl()}${src}` : src;
  return /^https:\/\//i.test(url) ? url : null;
}

export function siteLink(pathname: string) {
  return `${siteUrl()}${pathname}`;
}
