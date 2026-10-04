export type BottleChoice = {
  id: string; name: string; enabled: boolean;
  media?: { publicUrl: string; altText?: string } | null;
};
export type PackageChoice = { id: string; name: string; priceMinor: number; currency: string; enabled: boolean; paymentMode: string };

/** Decimal dollars to integer cents, without floating-point rounding or truncation. */
export function dollarsToMinor(value: string): number | null {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) return null;
  const minor = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'));
  return Number.isSafeInteger(minor) && minor <= 2_147_483_647 ? minor : null;
}

export function packageSavePayload(row: Record<string, unknown>): Record<string, unknown> {
  const { _priceDollars, _depositDollars } = row;
  const payload = { ...row };
  delete payload._priceDollars; delete payload._depositDollars; delete payload.packageBottles;
  if (typeof _priceDollars === 'string') payload.priceMinor = dollarsToMinor(_priceDollars);
  // Invalid deposit text must fail API validation, not silently clear an optional deposit.
  if (typeof _depositDollars === 'string') payload.depositAmountMinor = _depositDollars.trim() === '' ? null : dollarsToMinor(_depositDollars) ?? _depositDollars;
  return payload;
}

export function assignedBottleIds(row: Record<string, unknown>): string[] {
  if (Array.isArray(row.bottleOptionIds)) return row.bottleOptionIds.filter((id): id is string => typeof id === 'string');
  if (!Array.isArray(row.packageBottles)) return [];
  return row.packageBottles.flatMap((relation) => relation && typeof relation.bottleOptionId === 'string' ? [relation.bottleOptionId] : []);
}

export function packageChoiceLabel(pkg: PackageChoice): string {
  return `${pkg.name} — ${pkg.currency} ${(pkg.priceMinor / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} — ${pkg.enabled ? 'Enabled' : 'Disabled'}`;
}
