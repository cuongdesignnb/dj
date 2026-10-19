/** Published partners that have a logo; shown in every sponsor slot on the public site. */
export interface Sponsor {
  id: string;
  slug: string;
  name: string;
  /** Role line such as "Powered by", taken from the partner tagline. */
  role: string | null;
  href: string | null;
  logo: { src: string; alt: string; width: number | null; height: number | null };
}

/** Used only when the partner list cannot be read (e.g. during `next build`). */
export const FALLBACK_SPONSORS: Sponsor[] = [
  { id: 'mcq', slug: 'mcq', name: 'MCQ Supermarket', role: 'Powered by', href: null, logo: { src: '/assets/logo-mcq.svg', alt: 'MCQ Supermarket', width: 300, height: 100 } },
  { id: 'bihi-entertainment', slug: 'bihi-entertainment', name: 'BIHI Entertainment', role: 'Presented by', href: null, logo: { src: '/assets/logo-bihi.svg', alt: 'BIHI Entertainment', width: 772, height: 200 } },
];

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function size(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** Site paths and https URLs only. */
function safeSrc(value: unknown): string | null {
  const src = str(value);
  return src && (/^\/(?!\/)/.test(src) || /^https:\/\//i.test(src)) ? src : null;
}

function safeHref(value: unknown): string | null {
  const href = str(value);
  return href && /^https:\/\//i.test(href) ? href : null;
}

/** Accepts public partner rows ({ id, slug, name, tagline, websiteUrl, logo }) and keeps those with a usable logo. */
export function normaliseSponsors(rows: unknown): Sponsor[] {
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((raw) => {
    const row = record(raw);
    const logo = record(row.logo);
    const src = safeSrc(logo.src);
    const slug = str(row.slug);
    const id = str(row.id) ?? slug;
    const name = str(row.name) ?? slug;
    if (!src || !id || !slug || !name) return [];
    return [{
      id,
      slug,
      name,
      role: str(row.tagline),
      href: safeHref(row.websiteUrl),
      logo: { src, alt: str(logo.alt) ?? name, width: size(logo.width), height: size(logo.height) },
    }];
  });
}

/** Shape used by the shared EventsFooter. */
export function sponsorToFooterPartner(sponsor: Sponsor) {
  return {
    id: sponsor.id,
    name: sponsor.name,
    logo: { src: sponsor.logo.src, alt: sponsor.logo.alt, width: sponsor.logo.width ?? 240, height: sponsor.logo.height ?? 80 },
  };
}
