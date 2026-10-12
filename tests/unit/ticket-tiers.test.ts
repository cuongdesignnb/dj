import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ event: vi.fn(), eventUpdate: vi.fn(), findTier: vi.fn(), updateTier: vi.fn(), createTier: vi.fn() }));
vi.mock('@/server/db/client', () => ({ db: {
  event: { findUnique: mocks.event, update: mocks.eventUpdate },
  ticketTier: { findFirst: mocks.findTier, update: mocks.updateTier, create: mocks.createTier },
} }));
import { saveTicketTier, updateTicketSettings } from '@/server/services/cms';
import { TIER_AVAILABILITY, isoToLocalInput, localInputToIso, minorToDollars, tierSavePayload } from '@/lib/admin/events/tickets';

const eventId = '018f5e61-28ef-47c1-a1bb-6bde1489b777';
const valid = { name: 'Early Bird', priceMinor: 9900, currency: 'AUD', availabilityStatus: 'AVAILABLE', purchasableOnline: false, purchasableAtDoor: false };
const fieldErrors = async (promise: Promise<unknown>) => {
  try { await promise; } catch (error) { return { status: (error as { status?: number }).status, fields: (error as { fieldErrors?: Record<string, string> }).fieldErrors ?? {} }; }
  throw new Error('expected a validation error');
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.event.mockResolvedValue({ id: eventId });
  mocks.createTier.mockImplementation(async ({ data }) => ({ id: 'new-tier', ...data }));
  mocks.updateTier.mockImplementation(async ({ data }) => ({ id: 'seed-tier', ...data }));
  mocks.eventUpdate.mockImplementation(async () => ({ id: eventId, ticketSaleStart: null, ticketSaleEnd: null }));
});

describe('ticket tier form payload', () => {
  it('turns dollars into cents and blanks into "no limit"', () => {
    expect(tierSavePayload({ ...valid, _priceDollars: '99', capacity: '', maxQuantity: '', defaultQuantity: '', minQuantity: '', sortOrder: '', badge: '  ', currency: 'aud', eventId, createdAt: 'x' })).toEqual({
      name: 'Early Bird', priceMinor: 9900, currency: 'AUD', availabilityStatus: 'AVAILABLE', purchasableOnline: false, purchasableAtDoor: false,
      badge: null, capacity: null, maxQuantity: null, defaultQuantity: null, minQuantity: 1, sortOrder: 0,
    });
    expect(tierSavePayload({ ...valid, _priceDollars: '45.5' }).priceMinor).toBe(4550);
    expect(tierSavePayload({ ...valid, capacity: '200', maxQuantity: 10 })).toMatchObject({ capacity: 200, maxQuantity: 10 });
  });

  it('keeps invalid amounts so the API reports them on the field', () => {
    expect(tierSavePayload({ ...valid, _priceDollars: '$99' }).priceMinor).toBe('$99');
    expect(tierSavePayload({ ...valid, capacity: '1.5' }).capacity).toBe('1.5');
  });

  it('shows cents as dollars and offers every stored availability code with a label', () => {
    expect(minorToDollars(4500)).toBe('45.00');
    expect(minorToDollars(null)).toBe('');
    expect(TIER_AVAILABILITY.map((option) => option.value).sort()).toEqual(['AVAILABLE', 'NOT_AVAILABLE', 'ON_REQUEST', 'SOLD_OUT', 'UNKNOWN']);
  });
});

describe('ticket tier API validation', () => {
  it('saves a valid new tier', async () => {
    await expect(saveTicketTier(eventId, valid)).resolves.toMatchObject({ id: 'new-tier', priceMinor: 9900, availabilityStatus: 'AVAILABLE', minQuantity: 1 });
  });

  it('returns field errors (422), never a server error, for typical mistakes', async () => {
    const result = await fieldErrors(saveTicketTier(eventId, { ...valid, name: ' ', priceMinor: '$99', availabilityStatus: 'Available', capacity: 0, currency: 'aud' }));
    expect(result.status).toBe(422);
    expect(result.fields).toMatchObject({
      name: 'Enter a tier name.',
      priceMinor: 'Enter the price in dollars, e.g. 45.00.',
      availabilityStatus: 'Choose an availability option.',
      capacity: 'Capacity must be above 0, or blank for no limit.',
      currency: 'Use a 3-letter currency code, e.g. AUD.',
    });
    expect(mocks.createTier).not.toHaveBeenCalled();
  });

  it('checks per-order quantities against each other and the capacity', async () => {
    expect((await fieldErrors(saveTicketTier(eventId, { ...valid, minQuantity: 4, maxQuantity: 2 }))).fields.maxQuantity).toBe('Maximum per order cannot be below the minimum.');
    expect((await fieldErrors(saveTicketTier(eventId, { ...valid, minQuantity: 2, maxQuantity: 6, defaultQuantity: 8 }))).fields.defaultQuantity).toMatch(/between the minimum and maximum/);
    expect((await fieldErrors(saveTicketTier(eventId, { ...valid, capacity: 5, maxQuantity: 10 }))).fields.maxQuantity).toBe('Maximum per order cannot exceed the capacity.');
  });

  it('updates seeded tiers whose ids are database UUIDs without RFC version bits', async () => {
    const id = '00000000-0000-0000-0000-000000000004';
    mocks.findTier.mockResolvedValue({ id, eventId });
    await expect(saveTicketTier(eventId, { ...valid, id, minQuantity: 0 })).resolves.toMatchObject({ priceMinor: 9900 });
    expect(mocks.findTier).toHaveBeenCalledWith({ where: { id, eventId } });
  });
});

describe('ticket settings sale window', () => {
  it('round-trips the datetime input through ISO in the browser time zone', () => {
    const iso = localInputToIso('2026-11-01T20:30');
    expect(iso).toMatch(/^2026-1[01]-\d{2}T\d{2}:30:00\.000Z$/);
    expect(isoToLocalInput(iso)).toBe('2026-11-01T20:30');
    expect(localInputToIso('')).toBeNull();
    expect(isoToLocalInput(null)).toBe('');
  });

  it('accepts ISO instants and blanks, rejects bad values and reversed windows with field errors', async () => {
    await expect(updateTicketSettings(eventId, { saleStart: '2026-11-01T09:30:00.000Z', saleEnd: '' })).resolves.toBeDefined();
    expect(mocks.eventUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ ticketSaleStart: new Date('2026-11-01T09:30:00.000Z'), ticketSaleEnd: null }) }));
    expect((await fieldErrors(updateTicketSettings(eventId, { saleStart: '2026-11-01T20:30' }))).fields.saleStart).toBe('Choose a valid date and time.');
    expect((await fieldErrors(updateTicketSettings(eventId, { saleStart: '2026-11-02T00:00:00Z', saleEnd: '2026-11-01T00:00:00Z' }))).fields.saleEnd).toBe('Sale end must be after sale start.');
    expect((await fieldErrors(updateTicketSettings(eventId, { saleStatus: 'Open' }))).status).toBe(422);
  });
});
