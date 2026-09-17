import { Prisma } from '@prisma/client';
import type { SeedContext } from './context';
import { envSiteUrl } from './context';

const SETTINGS: Array<[string, unknown, boolean]> = [
  ['site.name', 'Connection Rave', true],
  ['site.tagline', 'Sound Meets Soul', true],
  ['site.default_locale', 'en', true],
  ['site.enabled_locales', ['en', 'vi'], true],
  ['seo.default_title', 'Connection Rave | Music, Events & Experiences in Perth', true],
  ['seo.default_description', 'Connection Rave brings published music events, artists and experiences to Perth.', true],
  ['seo.default_og_image', '/assets/event-poster.jpg', true],
  ['seo.site_url', envSiteUrl(), true],
  ['contact.email', null, true],
  ['contact.phone', null, true],
  ['contact.address', null, true],
  ['social.instagram', null, true],
  ['social.facebook', null, true],
  ['social.youtube', null, true],
  ['social.tiktok', null, true],
  ['social.spotify', null, true],
];

export async function seedSettings({ db }: SeedContext) {
  for (const [key, valueJson, isPublic] of SETTINGS) {
    const jsonValue = valueJson === null ? Prisma.JsonNull : (valueJson as Prisma.InputJsonValue);
    await db.siteSetting.upsert({ where: { key }, update: {}, create: { key, valueJson: jsonValue, isPublic } });
  }
}
