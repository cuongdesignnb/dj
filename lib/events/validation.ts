// Runtime validation for the EventPageData contract.
// Pure functions, safe to use in either environment.

import type {
  EventPageData,
  EventRecord,
  FeatureCard,
  FeatureIcon,
  MediaAsset,
  ArtistSummary,
  EventSocialLink,
  SocialPlatform,
  SiteBrand,
} from './types';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;

const FEATURE_ICONS: ReadonlySet<FeatureIcon> = new Set([
  'globe',
  'users',
  'music',
  'sparkles',
  'map-pin',
  'headphones',
]);

const SOCIAL_PLATFORMS: ReadonlySet<SocialPlatform> = new Set([
  'facebook',
  'instagram',
  'youtube',
  'tiktok',
]);

// Allow only http/https for external URLs and a relative path (starts with `/`)
// without leading double slash or protocol relative injection. No `javascript:`,
// no arbitrary schemes.
export function isSafeUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value.startsWith('//')) return false;
  if (value.startsWith('/')) {
    // Internal: must start with single slash, no scheme-like prefix
    return !/^\/[\\/]/.test(value);
  }
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function fail(errors: string[], path: string, message: string): boolean {
  errors.push(`${path}: ${message}`);
  return false;
}

function validateMedia(
  v: unknown,
  path: string,
  errors: string[],
  { optional = false }: { optional?: boolean } = {}
): boolean {
  if (v === null || v === undefined) {
    if (optional) return true;
    return fail(errors, path, 'missing required media asset');
  }
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const m = v as Partial<MediaAsset>;
  if (typeof m.src !== 'string' || m.src.length === 0) return fail(errors, `${path}.src`, 'must be a non-empty string');
  if (!isSafeUrl(m.src) && !(m.src as string).startsWith('/assets/')) {
    return fail(errors, `${path}.src`, 'must be a safe url or local asset path');
  }
  if (typeof m.alt !== 'string') return fail(errors, `${path}.alt`, 'must be a string');
  if (typeof m.width !== 'number' || m.width <= 0) return fail(errors, `${path}.width`, 'must be a positive number');
  if (typeof m.height !== 'number' || m.height <= 0) return fail(errors, `${path}.height`, 'must be a positive number');
  if (m.objectPosition !== undefined && typeof m.objectPosition !== 'string') {
    return fail(errors, `${path}.objectPosition`, 'must be a string when provided');
  }
  return true;
}

function validateFeature(
  v: unknown,
  path: string,
  errors: string[],
): boolean {
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const f = v as Partial<FeatureCard>;
  if (typeof f.id !== 'string' || !f.id) return fail(errors, `${path}.id`, 'must be a non-empty string');
  if (typeof f.icon !== 'string' || !FEATURE_ICONS.has(f.icon as FeatureIcon)) {
    return fail(errors, `${path}.icon`, `must be one of ${Array.from(FEATURE_ICONS).join(', ')}`);
  }
  if (typeof f.title !== 'string' || !f.title) return fail(errors, `${path}.title`, 'must be a non-empty string');
  if (typeof f.description !== 'string') return fail(errors, `${path}.description`, 'must be a string');
  return true;
}

function validateArtist(
  v: unknown,
  path: string,
  errors: string[],
): boolean {
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const a = v as Partial<ArtistSummary>;
  if (typeof a.id !== 'string' || !a.id) return fail(errors, `${path}.id`, 'must be a non-empty string');
  if (typeof a.slug !== 'string' || !a.slug) return fail(errors, `${path}.slug`, 'must be a non-empty string');
  if (typeof a.name !== 'string' || !a.name) return fail(errors, `${path}.name`, 'must be a non-empty string');
  if (typeof a.country !== 'string' || !a.country) return fail(errors, `${path}.country`, 'must be a non-empty string');
  validateMedia(a.portrait, `${path}.portrait`, errors, { optional: true });
  if (a.profileHref !== null && a.profileHref !== undefined) {
    if (typeof a.profileHref !== 'string') return fail(errors, `${path}.profileHref`, 'must be a string or null');
    if (!a.profileHref.startsWith('/')) return fail(errors, `${path}.profileHref`, 'profile link must be an internal path');
  }
  return true;
}

function validateSocial(
  v: unknown,
  path: string,
  errors: string[],
): boolean {
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const s = v as Partial<EventSocialLink>;
  if (typeof s.id !== 'string' || !s.id) return fail(errors, `${path}.id`, 'must be a non-empty string');
  if (typeof s.platform !== 'string' || !SOCIAL_PLATFORMS.has(s.platform as SocialPlatform)) {
    return fail(errors, `${path}.platform`, `must be one of ${Array.from(SOCIAL_PLATFORMS).join(', ')}`);
  }
  if (typeof s.url !== 'string' || !isSafeUrl(s.url)) return fail(errors, `${path}.url`, 'must be a safe url');
  return true;
}

function validateSite(
  v: unknown,
  path: string,
  errors: string[],
): boolean {
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const s = v as Partial<SiteBrand>;
  if (typeof s.brandName !== 'string') return fail(errors, `${path}.brandName`, 'must be a string');
  if (typeof s.tagline !== 'string') return fail(errors, `${path}.tagline`, 'must be a string');
  validateMedia(s.logo, `${path}.logo`, errors);
  if (!Array.isArray(s.partners)) return fail(errors, `${path}.partners`, 'must be an array');
  (s.partners as unknown[]).forEach((p, i) => {
    if (!isPlainObject(p)) return fail(errors, `${path}.partners[${i}]`, 'must be an object');
    const partner = p as { id?: unknown; name?: unknown; logo?: unknown };
    if (typeof partner.id !== 'string') return fail(errors, `${path}.partners[${i}].id`, 'must be a string');
    if (typeof partner.name !== 'string') return fail(errors, `${path}.partners[${i}].name`, 'must be a string');
    validateMedia(partner.logo, `${path}.partners[${i}].logo`, errors);
  });
  if (!isPlainObject(s.contact)) return fail(errors, `${path}.contact`, 'must be an object');
  const contact = s.contact as { email?: unknown; phone?: unknown; socials?: unknown };
  if (contact.email !== null && contact.email !== undefined && typeof contact.email !== 'string') {
    return fail(errors, `${path}.contact.email`, 'must be string or null');
  }
  if (contact.phone !== null && contact.phone !== undefined && typeof contact.phone !== 'string') {
    return fail(errors, `${path}.contact.phone`, 'must be string or null');
  }
  if (!Array.isArray(contact.socials)) return fail(errors, `${path}.contact.socials`, 'must be an array');
  (contact.socials as unknown[]).forEach((social, i) => {
    validateSocial(social, `${path}.contact.socials[${i}]`, errors);
  });
  return true;
}

function validateEvent(
  v: unknown,
  path: string,
  errors: string[],
): boolean {
  if (!isPlainObject(v)) return fail(errors, path, 'must be an object');
  const e = v as Partial<EventRecord>;
  if (typeof e.id !== 'string') return fail(errors, `${path}.id`, 'must be a string');
  if (typeof e.slug !== 'string') return fail(errors, `${path}.slug`, 'must be a string');
  if (typeof e.name !== 'string') return fail(errors, `${path}.name`, 'must be a string');
  if (typeof e.title !== 'string') return fail(errors, `${path}.title`, 'must be a string');
  if (typeof e.intro !== 'string') return fail(errors, `${path}.intro`, 'must be a string');
  if (typeof e.accentLine !== 'string') return fail(errors, `${path}.accentLine`, 'must be a string');
  if (!Array.isArray(e.aboutParagraphs) || !e.aboutParagraphs.every((p) => typeof p === 'string')) {
    return fail(errors, `${path}.aboutParagraphs`, 'must be a string array');
  }
  if (!Array.isArray(e.genres) || !e.genres.every((g) => typeof g === 'string')) {
    return fail(errors, `${path}.genres`, 'must be a string array');
  }
  for (const k of ['startsAt', 'endsAt', 'doorsOpenAt'] as const) {
    if (e[k] !== null && e[k] !== undefined) {
      if (typeof e[k] !== 'string' || !ISO_DATE_RE.test(e[k] as string)) {
        return fail(errors, `${path}.${k}`, 'must be ISO-8601 string or null');
      }
    }
  }
  if (typeof e.timeZone !== 'string') return fail(errors, `${path}.timeZone`, 'must be a string');

  validateMedia(e.poster, `${path}.poster`, errors, { optional: true });
  validateMedia(e.heroBackground, `${path}.heroBackground`, errors, { optional: true });
  validateMedia(e.experienceImage, `${path}.experienceImage`, errors, { optional: true });

  if (!Array.isArray(e.highlights)) return fail(errors, `${path}.highlights`, 'must be an array');
  (e.highlights as unknown[]).forEach((f, i) => validateFeature(f, `${path}.highlights[${i}]`, errors));

  if (!Array.isArray(e.expectations)) return fail(errors, `${path}.expectations`, 'must be an array');
  (e.expectations as unknown[]).forEach((f, i) => validateFeature(f, `${path}.expectations[${i}]`, errors));

  if (!Array.isArray(e.artists)) return fail(errors, `${path}.artists`, 'must be an array');
  (e.artists as unknown[]).forEach((a, i) => validateArtist(a, `${path}.artists[${i}]`, errors));

  if (!isPlainObject(e.venue)) return fail(errors, `${path}.venue`, 'must be an object');
  const venue = e.venue as { name?: unknown; city?: unknown; address?: unknown; description?: unknown; image?: unknown; mapUrl?: unknown };
  if (typeof venue.name !== 'string') return fail(errors, `${path}.venue.name`, 'must be a string');
  if (typeof venue.city !== 'string') return fail(errors, `${path}.venue.city`, 'must be a string');
  if (venue.address !== null && venue.address !== undefined && typeof venue.address !== 'string') {
    return fail(errors, `${path}.venue.address`, 'must be string or null');
  }
  if (typeof venue.description !== 'string') return fail(errors, `${path}.venue.description`, 'must be a string');
  validateMedia(venue.image, `${path}.venue.image`, errors, { optional: true });
  if (venue.mapUrl !== null && venue.mapUrl !== undefined && typeof venue.mapUrl !== 'string') {
    return fail(errors, `${path}.venue.mapUrl`, 'must be string or null');
  }

  if (!isPlainObject(e.actions)) return fail(errors, `${path}.actions`, 'must be an object');
  const actions = e.actions as { ticketUrl?: unknown; vipRequestUrl?: unknown };
  if (actions.ticketUrl !== null && actions.ticketUrl !== undefined) {
    if (typeof actions.ticketUrl !== 'string' || !isSafeUrl(actions.ticketUrl)) {
      return fail(errors, `${path}.actions.ticketUrl`, 'must be safe url or null');
    }
  }
  if (actions.vipRequestUrl !== null && actions.vipRequestUrl !== undefined) {
    if (typeof actions.vipRequestUrl !== 'string' || !isSafeUrl(actions.vipRequestUrl)) {
      return fail(errors, `${path}.actions.vipRequestUrl`, 'must be safe url or null');
    }
  }

  if (!isPlainObject(e.seo)) return fail(errors, `${path}.seo`, 'must be an object');
  const seo = e.seo as { title?: unknown; description?: unknown; image?: unknown };
  if (typeof seo.title !== 'string') return fail(errors, `${path}.seo.title`, 'must be a string');
  if (typeof seo.description !== 'string') return fail(errors, `${path}.seo.description`, 'must be a string');
  validateMedia(seo.image, `${path}.seo.image`, errors, { optional: true });

  if (e.contentStatus !== 'preview' && e.contentStatus !== 'published') {
    return fail(errors, `${path}.contentStatus`, 'must be preview or published');
  }

  // Time ordering: only enforce when both ends exist
  if (e.startsAt && e.endsAt && (e.startsAt as string) > (e.endsAt as string)) {
    return fail(errors, `${path}.endsAt`, 'must not be before startsAt');
  }

  return true;
}

export function validateEventPageData(raw: unknown):
  | { ok: true; data: EventPageData }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isPlainObject(raw)) {
    return { ok: false, errors: ['root: must be an object'] };
  }
  const r = raw as { schemaVersion?: unknown; event?: unknown; site?: unknown };
  if (r.schemaVersion !== 1) return { ok: false, errors: ['schemaVersion: must equal 1'] };
  validateEvent(r.event, 'event', errors);
  validateSite(r.site, 'site', errors);
  if (errors.length) return { ok: false, errors };
  return { ok: true, data: raw as unknown as EventPageData };
}
