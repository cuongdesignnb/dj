import type { VipPackage, VipPageData, VipSelection } from './types';

// Moves a VIP selection between /tables and /book-now through the URL.
//
// Only identifiers travel. Everything the booking page displays — booth label,
// bottle names, capacity, price — is rebuilt from canonical data, so a tampered
// query can change what is *selected* but never what anything *costs* or says.
//
// Nothing personal goes in the URL: no name, email, phone or special request.

export const VIP_EXPERIENCE_PARAM = 'vip';

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}

/**
 * Reads a selection out of the query, discarding anything the canonical data
 * does not recognise. Unknown booth ids become null, unknown bottle ids are
 * dropped, duplicates collapse, and the list is clamped to the package maximum.
 */
export function parseVipSelection(
  searchParams: SearchParams,
  data: Pick<VipPageData, 'booths' | 'bottles' | 'package'>,
): VipSelection {
  const boothParam = firstValue(searchParams.booth)?.trim().toLowerCase() ?? null;
  const knownBooth = data.booths.find(
    (booth) => booth.id.toLowerCase() === boothParam && booth.requestable,
  );

  const bottlesParam = firstValue(searchParams.bottles) ?? '';
  const requested = bottlesParam
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const bottleIds: string[] = [];
  for (const id of requested) {
    if (seen.has(id)) continue;
    const bottle = data.bottles.find((b) => b.id.toLowerCase() === id && b.enabled);
    if (!bottle) continue;
    seen.add(id);
    bottleIds.push(bottle.id);
    if (bottleIds.length >= data.package.maxBottleSelections) break;
  }

  return { boothId: knownBooth?.id ?? null, bottleIds };
}

/** True when the query asked for the VIP experience (the default here anyway). */
export function parseExperience(searchParams: SearchParams): 'vip' {
  const value = firstValue(searchParams.experience)?.trim().toLowerCase();
  return value === VIP_EXPERIENCE_PARAM ? 'vip' : 'vip';
}

/**
 * Builds the /book-now link for a selection. Empty parts are omitted so a bare
 * "Send Booking Request" with nothing chosen still produces a clean URL.
 */
export function buildVipBookingUrl(selection: VipSelection, basePath = '/book-now'): string {
  const params = new URLSearchParams();
  params.set('experience', VIP_EXPERIENCE_PARAM);
  if (selection.boothId) params.set('booth', selection.boothId);
  if (selection.bottleIds.length > 0) params.set('bottles', selection.bottleIds.join(','));
  return `${basePath}?${params.toString()}`;
}

/** Toggles a bottle, refusing to silently evict one when the cap is reached. */
export function toggleBottle(
  selected: string[],
  bottleId: string,
  pkg: Pick<VipPackage, 'maxBottleSelections'>,
): { bottleIds: string[]; rejected: boolean } {
  if (selected.includes(bottleId)) {
    return { bottleIds: selected.filter((id) => id !== bottleId), rejected: false };
  }
  if (selected.length >= pkg.maxBottleSelections) {
    return { bottleIds: selected, rejected: true };
  }
  return { bottleIds: [...selected, bottleId], rejected: false };
}

export function boothLabel(
  boothId: string | null | undefined,
  booths: VipPageData['booths'],
): string | null {
  if (!boothId) return null;
  return booths.find((booth) => booth.id === boothId)?.label ?? null;
}

export function bottleNames(
  bottleIds: string[],
  bottles: VipPageData['bottles'],
): string[] {
  return bottleIds.flatMap((id) => {
    const bottle = bottles.find((b) => b.id === id);
    return bottle ? [bottle.name] : [];
  });
}
