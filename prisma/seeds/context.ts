import fs from 'node:fs';
import path from 'node:path';
import type { Prisma } from '@prisma/client';

export type SeedDb = Prisma.TransactionClient;

export interface SeedContext {
  db: SeedDb;
  preview: boolean;
}

export const LOCALES = [
  { code: 'en', name: 'English', isDefault: true },
  { code: 'vi', name: 'Vietnamese', isDefault: false },
] as const;

export const ARTISTS = [
  ['ryal', 'RYAL', 'VIETNAM', 'artist-ryal.jpg'],
  ['nicole-chen', 'NICOLE CHEN', 'SINGAPORE', 'artist-nicole-chen.jpg'],
  ['kickcheeze', 'KICKCHEEZE', 'AUSTRALIA', 'artist-kickcheeze.jpg'],
  ['bi-hi', 'BI HI', 'VIETNAM', 'artist-bi-hi.jpg'],
  ['rysal', 'RYSAL', 'AUSTRALIA', 'artist-rysal.jpg'],
  ['maya', 'MAYA', 'SINGAPORE', 'artist-maya.jpg'],
  ['mico', 'MICO', 'AUSTRALIA', 'artist-mico.jpg'],
  ['ems', 'EMS', 'AUSTRALIA', 'artist-ems.jpg'],
] as const;

export const BOTTLES = [
  'Belvedere Vodka',
  'Hennessy VS',
  'El Jimador Tequila',
  'Moët & Chandon',
  'Jager',
  'WAP Cranberry Peach',
] as const;

export const EVENT_GENRES = ['EDM', 'Hardstyle', 'Techno', 'Vinahouse'] as const;

export const TICKET_TIERS = [
  { name: 'Student Concession', priceMinor: 3500, sortOrder: 0 },
  { name: 'Final Release', priceMinor: 6600, sortOrder: 1 },
  { name: 'Ticket At Door', priceMinor: 10000, sortOrder: 2 },
] as const;

export const BOOTH_CODES = Array.from({ length: 12 }, (_, index) => `B${index + 1}`);

export const REQUIRED_MEDIA = [
  ['assets/hero-crowd.jpg', 'Connection Rave crowd visual'],
  ['assets/event-poster.jpg', 'DESTINY event poster'],
  ['assets/vip-booth.jpg', 'VIP booth visual'],
  ['assets/bar-list.jpg', 'Bottle list visual'],
  ['assets/club-map.jpg', 'Metro City club map'],
  ['assets/logo-connection.svg', 'Connection logo'],
  ['assets/logo-mcq.svg', 'MCQ logo'],
  ['assets/logo-bihi.svg', 'BIHI Entertainment logo'],
  ...ARTISTS.map(([, name, country, file]) => [`assets/${file}`, `${name} — ${country} lineup portrait`]),
  ['merch/cutout-tee.svg', 'DESTINY Oversized Tee preview'],
  ['merch/cutout-hoodie.svg', 'Connection Hoodie preview'],
  ['merch/cutout-poster.svg', 'Metro City Poster preview'],
  ['merch/cap.svg', 'Sound Meets Soul Cap preview'],
  ['merch/tote.svg', 'Connection Tote preview'],
  ['merch/sticker-pack.svg', 'Rave Sticker Pack preview'],
] as const;

export function publicUrl(storageKey: string) {
  return `/${storageKey}`;
}

export async function upsertMedia(db: SeedDb, storageKey: string, altText: string) {
  const filePath = path.join(process.cwd(), 'public', storageKey);
  const sizeBytes = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
  const isSvg = storageKey.toLowerCase().endsWith('.svg');
  return db.mediaAsset.upsert({
    where: { storageKey },
    update: { publicUrl: publicUrl(storageKey), altText, sizeBytes },
    create: {
      storageDriver: 'LOCAL',
      storageKey,
      publicUrl: publicUrl(storageKey),
      mimeType: isSvg ? 'image/svg+xml' : 'image/jpeg',
      sizeBytes,
      altText,
    },
  });
}

export async function registerRequiredMedia(db: SeedDb) {
  const rows = new Map<string, Awaited<ReturnType<typeof upsertMedia>>>();
  for (const [storageKey, altText] of REQUIRED_MEDIA) {
    rows.set(storageKey, await upsertMedia(db, storageKey, altText));
  }
  return rows;
}

export function isPreviewEnabled() {
  return process.env.SEED_PREVIEW_CONTENT === 'true' || process.argv.includes('--preview');
}

export function envSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || null;
}
