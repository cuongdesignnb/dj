import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ findEvent: vi.fn(), bottles: vi.fn(), allowed: vi.fn(), create: vi.fn(), transaction: vi.fn() }));
vi.mock('@/server/db/client', () => ({ db: { event: { findFirst: mocks.findEvent }, bottleOption: { findMany: mocks.bottles }, vipPackageBottle: { findMany: mocks.allowed }, $transaction: mocks.transaction } }));
import { createBooking } from '@/server/services/leads';
import { bookingSchema } from '@/server/validators/api';
const pkg = { id: 'qa-package', enabled: true, paymentMode: 'REQUEST_ONLY', capacity: 15, includedBottleCount: 3, minBottleSelection: 0, maxBottleSelection: 3 };
const event = { id: 'qa-event', vipEnabled: true, vipBookingEnabled: true, vipAvailabilityMode: 'REQUEST_ONLY', vipPackages: [pkg], vipBooths: [{ id: 'qa-booth', enabled: true, requestable: true, availabilityStatus: 'AVAILABLE' }] };
const input = () => bookingSchema.parse({ eventId: 'destiny', vipPackageId: pkg.id, fullName: 'QA Guest', email: 'qa@example.test', groupSize: 2, preferredBoothId: null, bottleIds: [] });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findEvent.mockResolvedValue(structuredClone(event));
  mocks.bottles.mockResolvedValue([{ id: 'qa-bottle' }]);
  mocks.allowed.mockResolvedValue([{ bottleOptionId: 'qa-bottle' }]);
  mocks.create.mockResolvedValue({ id: 'qa-request', status: 'RECEIVED', createdAt: new Date('2026-10-04T00:00:00Z') });
  mocks.transaction.mockImplementation(async (callback) => callback({ bookingRequest: { create: mocks.create } }));
});
describe('authoritative booking contract', () => {
  it('requires eventId at the API boundary', () => {
    const raw = { ...input(), eventId: undefined };
    expect(bookingSchema.safeParse(raw).success).toBe(false);
  });
  it('requires an active package in the service even if the schema allows null', async () => {
    await expect(createBooking({ ...input(), vipPackageId: null })).rejects.toMatchObject({ status: 422, fieldErrors: { vipPackageId: expect.any(String) } });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each(['vipEnabled', 'vipBookingEnabled'])('rejects %s=false before creating anything', async (flag) => {
    mocks.findEvent.mockResolvedValue({ ...event, [flag]: false });
    await expect(createBooking(input())).rejects.toMatchObject({ status: 409 });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects a disabled package', async () => {
    mocks.findEvent.mockResolvedValue({ ...event, vipPackages: [{ ...pkg, enabled: false }] });
    await expect(createBooking(input())).rejects.toMatchObject({ status: 422 });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('accepts bottles with a nullable booth in REQUEST_ONLY and saves atomically as RECEIVED', async () => {
    expect(await createBooking({ ...input(), bottleIds: ['qa-bottle'] })).toMatchObject({ id: 'qa-request', status: 'RECEIVED' });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ vipPackageId: pkg.id, preferredBoothId: undefined, status: 'RECEIVED', bottles: { create: [{ bottleOptionId: 'qa-bottle' }] } }) }));
  });
  it('enforces package group capacity', async () => {
    await expect(createBooking({ ...input(), groupSize: 16 })).rejects.toMatchObject({ status: 422, fieldErrors: { groupSize: expect.any(String) } });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('requires a booth outside REQUEST_ONLY', async () => {
    mocks.findEvent.mockResolvedValue({ ...event, vipAvailabilityMode: 'LIVE' });
    await expect(createBooking(input())).rejects.toMatchObject({ status: 422, fieldErrors: { preferredBoothId: expect.any(String) } });
  });
  it('rejects disabled or unavailable booths', async () => {
    mocks.findEvent.mockResolvedValue({ ...event, vipBooths: [{ ...event.vipBooths[0], availabilityStatus: 'UNAVAILABLE' }] });
    await expect(createBooking({ ...input(), preferredBoothId: 'qa-booth' })).rejects.toMatchObject({ status: 422 });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('rejects bottles not linked to this package', async () => {
    mocks.allowed.mockResolvedValue([]);
    await expect(createBooking({ ...input(), bottleIds: ['qa-bottle'] })).rejects.toMatchObject({ status: 422, fieldErrors: { bottleIds: expect.any(String) } });
  });
  it('enforces minimum bottle selection', async () => {
    mocks.findEvent.mockResolvedValue({ ...event, vipPackages: [{ ...pkg, minBottleSelection: 1 }] });
    await expect(createBooking(input())).rejects.toMatchObject({ status: 422, fieldErrors: { bottleIds: expect.any(String) } });
  });
});
