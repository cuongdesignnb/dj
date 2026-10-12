import { dollarsToMinor } from './vip-package';

/** Ticket tier availability as editors read it; the codes are what the API stores. */
export const TIER_AVAILABILITY = [
  { value: 'AVAILABLE', label: 'Available', help: 'Shown as available on the tickets page.' },
  { value: 'ON_REQUEST', label: 'On request', help: 'Listed, but sold by request rather than as available.' },
  { value: 'NOT_AVAILABLE', label: 'Not available', help: 'Listed as not available.' },
  { value: 'SOLD_OUT', label: 'Sold out', help: 'Listed as sold out.' },
  { value: 'UNKNOWN', label: 'To be announced', help: 'Availability not confirmed yet.' },
] as const;

export const SALE_STATUS_LABELS: Record<string, string> = {
  COMING_SOON: 'Coming soon', ON_SALE: 'On sale', PAUSED: 'Paused', SOLD_OUT: 'Sold out', ENDED: 'Ended',
};

export const VIP_PAYMENT_LABELS: Record<string, string> = {
  REQUEST_ONLY: 'Request only — no payment', FULL_PAYMENT: 'Full payment', DEPOSIT: 'Deposit',
};

/** Integer cents to an editable dollar string, e.g. 4500 → "45.00". */
export function minorToDollars(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? (value / 100).toFixed(2) : '';
}

export function formatMoney(minor: number | null, currency: string): string | null {
  if (minor === null) return null;
  return `${currency} ${(minor / 100).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Blank optional number fields mean "no value"; anything else must be a whole number. */
function optionalWhole(value: unknown): unknown {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const text = String(value).trim();
  return /^\d+$/.test(text) ? Number(text) : text;
}

const TIER_FIELDS = ['id', 'name', 'description', 'priceMinor', 'currency', 'badge', 'capacity', 'availabilityStatus', 'purchasableOnline', 'purchasableAtDoor', 'minQuantity', 'maxQuantity', 'defaultQuantity', 'highlighted', 'sortOrder', 'enabled', 'providerName', 'providerUrl', 'providerExternalId'] as const;

/**
 * Builds the API body for a ticket tier row. Price is edited in dollars; text
 * that is not a valid amount is sent as-is so the API reports it on the field
 * instead of it silently becoming 0.
 */
export function tierSavePayload(row: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of TIER_FIELDS) if (row[key] !== undefined) payload[key] = row[key];
  if (typeof row._priceDollars === 'string') payload.priceMinor = dollarsToMinor(row._priceDollars) ?? row._priceDollars;
  for (const key of ['capacity', 'maxQuantity', 'defaultQuantity'] as const) payload[key] = optionalWhole(row[key]);
  const min = optionalWhole(row.minQuantity);
  payload.minQuantity = min === null ? 1 : min;
  const order = optionalWhole(row.sortOrder);
  payload.sortOrder = order === null ? 0 : order;
  if (typeof payload.currency === 'string') payload.currency = payload.currency.trim().toUpperCase();
  if (typeof payload.badge === 'string') payload.badge = payload.badge.trim() || null;
  if (typeof payload.name === 'string') payload.name = payload.name.trim();
  return payload;
}

/** "2026-11-01T09:30:00.000Z" → value for <input type="datetime-local"> in the browser's time zone. */
export function isoToLocalInput(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** <input type="datetime-local"> value (browser time zone) → ISO instant, blank → null. */
export function localInputToIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}
