import { unwrapApiData } from '@/lib/api/public';
import { PUBLIC_CACHE_TAGS } from '@/lib/cache/public-tags';

export interface PublicListingContent {
  hero?: {
    breadcrumb?: string;
    eyebrow?: string;
    title?: string;
    titleLine1?: string;
    titleLine2?: string;
    description?: string;
    image?: PublicMedia | null;
    sideNotes?: string[];
    footNotes?: string[];
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
  };
  filters?: PublicListingFilter[];
  sections?: PublicListingSection[];
  emptyState?: PublicListingEmptyState;
  finalCta?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    primary?: { label?: string; href?: string };
    secondary?: { label?: string; href?: string };
    background?: PublicMedia | null;
  };
  seo?: PublicListingSeo;
}

export interface PublicListingFilter {
  key: string;
  label: string;
  options: string[];
}

export interface PublicListingSection {
  key: string;
  eyebrow?: string;
  title: string;
  description?: string;
  enabled?: boolean;
}

export interface PublicListingEmptyState {
  title: string;
  description: string;
  cta?: { label: string; href: string };
}

export interface PublicListingSeo {
  title?: string;
  description?: string;
  ogImage?: PublicMedia | null;
  index?: boolean;
  follow?: boolean;
}

export interface PublicMedia {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function asImage(value: unknown) {
  if (!isRecord(value)) return undefined;
  const src = asString(value.src);
  if (!src) return undefined;
  return {
    src,
    alt: asString(value.alt) ?? '',
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
  };
}

function asAction(value: unknown) {
  if (!isRecord(value)) return undefined;
  const label = asString(value.label);
  const href = asString(value.href);
  return label && href ? { label, href } : undefined;
}

function normalize(value: unknown): PublicListingContent | null {
  if (!isRecord(value)) return null;
  const hero = isRecord(value.hero)
    ? {
        breadcrumb: asString(value.hero.breadcrumb),
        eyebrow: asString(value.hero.eyebrow),
        title: asString(value.hero.title),
        titleLine1: asString(value.hero.titleLine1),
        titleLine2: asString(value.hero.titleLine2),
        description: asString(value.hero.description),
        image: asImage(value.hero.image),
        sideNotes: Array.isArray(value.hero.sideNotes) ? value.hero.sideNotes.filter((item): item is string => typeof item === 'string') : undefined,
        footNotes: Array.isArray(value.hero.footNotes) ? value.hero.footNotes.filter((item): item is string => typeof item === 'string') : undefined,
        primary: asAction(value.hero.primary),
        secondary: asAction(value.hero.secondary),
      }
    : undefined;
  const filters = Array.isArray(value.filters)
    ? value.filters.flatMap((item) => isRecord(item) && typeof item.key === 'string' && typeof item.label === 'string' ? [{ key: item.key, label: item.label, options: Array.isArray(item.options) ? item.options.filter((option): option is string => typeof option === 'string') : [] }] : [])
    : undefined;
  const sections = Array.isArray(value.sections)
    ? value.sections.flatMap((item) => isRecord(item) && typeof item.key === 'string' && typeof item.title === 'string' ? [{ key: item.key, eyebrow: asString(item.eyebrow), title: item.title, description: asString(item.description), enabled: item.enabled !== false }] : [])
    : undefined;
  const emptyState = isRecord(value.emptyState) && typeof value.emptyState.title === 'string' && typeof value.emptyState.description === 'string'
    ? { title: value.emptyState.title, description: value.emptyState.description, cta: asAction(value.emptyState.cta) }
    : undefined;
  const finalCta = isRecord(value.finalCta)
    ? { eyebrow: asString(value.finalCta.eyebrow), title: asString(value.finalCta.title), subtitle: asString(value.finalCta.subtitle), description: asString(value.finalCta.description), primary: asAction(value.finalCta.primary), secondary: asAction(value.finalCta.secondary), background: asImage(value.finalCta.background) }
    : undefined;
  const seo = isRecord(value.seo)
    ? { title: asString(value.seo.title), description: asString(value.seo.description), ogImage: asImage(value.seo.ogImage) ?? null, index: typeof value.seo.index === 'boolean' ? value.seo.index : undefined, follow: typeof value.seo.follow === 'boolean' ? value.seo.follow : undefined }
    : undefined;
  return { hero, filters, sections, emptyState, finalCta, seo };
}

/** Public listing chrome is a page-content record, not a repository fallback. */
export async function fetchPublicListingContent(baseUrl: string, key: string, revalidateSeconds = 300): Promise<PublicListingContent | null> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/page-content/${encodeURIComponent(key)}`, {
      headers: { accept: 'application/json' },
      next: { revalidate: revalidateSeconds, tags: [PUBLIC_CACHE_TAGS.pageContent(key)] },
    });
    if (!response.ok) return null;
    const payload = unwrapApiData(await response.json());
    return normalize(isRecord(payload) ? payload.data : payload);
  } catch {
    return null;
  }
}

export function listingTitleLines(hero: PublicListingContent['hero'], fallback: string[]): string[] {
  if (hero?.titleLine1 || hero?.titleLine2) return [hero.titleLine1, hero.titleLine2].filter((value): value is string => Boolean(value));
  if (hero?.title) return [hero.title];
  return fallback;
}

export function listingImage(hero: PublicListingContent['hero'], fallback: { src: string; alt: string }): PublicMedia {
  return hero?.image?.src ? { ...hero.image, alt: hero.image.alt ?? fallback.alt } : fallback;
}

export function listingAction(value: { label?: string; href?: string } | undefined, fallback: { label: string; href: string }): { label: string; href: string } {
  return value?.label && value.href ? { label: value.label, href: value.href } : fallback;
}

export function listingSection(
  content: PublicListingContent | undefined,
  key: string,
  fallback: Omit<PublicListingSection, 'key' | 'enabled'>,
): PublicListingSection {
  const section = content?.sections?.find((item) => item.key === key);
  return {
    key,
    eyebrow: section?.eyebrow ?? fallback.eyebrow,
    title: section?.title ?? fallback.title,
    description: section?.description ?? fallback.description,
    enabled: section?.enabled !== false,
  };
}

export function listingFilter(
  content: PublicListingContent | undefined,
  key: string,
  fallback: Omit<PublicListingFilter, 'key'>,
): PublicListingFilter {
  const filter = content?.filters?.find((item) => item.key === key);
  return {
    key,
    label: filter?.label ?? fallback.label,
    options: filter?.options?.length ? filter.options : fallback.options,
  };
}

export function listingEmpty(
  content: PublicListingContent | undefined,
  fallback: PublicListingEmptyState,
): PublicListingEmptyState {
  return content?.emptyState ?? fallback;
}
