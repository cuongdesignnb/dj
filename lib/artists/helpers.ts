import type { Artist, ArtistCountryFilter } from './types';

export const ARTIST_COUNTRY_FILTERS: ArtistCountryFilter[] = [
  'all',
  'VIETNAM',
  'SINGAPORE',
  'AUSTRALIA',
];

export function countryFilterLabel(filter: ArtistCountryFilter): string {
  if (filter === 'all') return 'All';
  return filter.charAt(0) + filter.slice(1).toLowerCase();
}

export function matchesCountry(artist: Artist, filter: ArtistCountryFilter): boolean {
  return filter === 'all' || artist.country === filter;
}

/** Reads ?country=vietnam, case-insensitively; anything unknown falls back to all. */
export function parseCountryFilter(
  value: string | string[] | undefined,
): ArtistCountryFilter {
  const raw = (Array.isArray(value) ? value[0] : value)?.trim().toUpperCase();
  return ARTIST_COUNTRY_FILTERS.includes(raw as ArtistCountryFilter)
    ? (raw as ArtistCountryFilter)
    : 'all';
}

/**
 * Picks the artists shown under "More from the lineup".
 *
 * Deterministic on purpose — a random pick would render differently on the
 * server and the client and produce a hydration mismatch. Same country first,
 * then source order, never the artist whose page this is.
 */
export function relatedArtists(all: Artist[], current: Artist, limit = 3): Artist[] {
  const others = all.filter((candidate) => candidate.slug !== current.slug);
  const sameCountry = others.filter((candidate) => candidate.country === current.country);
  const rest = others.filter((candidate) => candidate.country !== current.country);
  return [...sameCountry, ...rest].slice(0, limit);
}

/** "Artist bio coming soon." is a fallback, never stored as if it were a bio. */
export function artistBioFallback(): string {
  return 'Artist bio coming soon. More artist information will be announced as the event gets closer.';
}

export function setTimeLabel(artist: Artist): string {
  if (artist.setTimeStatus === 'confirmed' && artist.setTime) return artist.setTime;
  return 'To be announced';
}
