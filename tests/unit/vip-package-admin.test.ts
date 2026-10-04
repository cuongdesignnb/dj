import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  event: vi.fn(), eventUpdate: vi.fn(), find: vi.fn(), update: vi.fn(), create: vi.fn(),
  read: vi.fn(), bottles: vi.fn(), clear: vi.fn(), assign: vi.fn(), transaction: vi.fn(),
}));
vi.mock('@/server/db/client', () => ({ db: {
  event: { findUnique: mocks.event, update: mocks.eventUpdate },
  vipPackage: { findFirst: mocks.find, update: mocks.update, create: mocks.create, findUniqueOrThrow: mocks.read },
  $transaction: mocks.transaction,
} }));
import { saveVipPackage, updateVipSettings, vipPackageInput } from '@/server/services/cms';
import { databaseUuid } from '@/server/validators/identifiers';
import { normalizeApiError } from '@/lib/api/client';
import { assignedBottleIds, dollarsToMinor, packageSavePayload } from '@/lib/admin/events/vip-package';

const productionPackage = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'BOOTH PACKAGE', description: null, priceMinor: 320000,
  depositAmountMinor: null, currency: 'AUD', capacity: 15,
  includedBottleCount: 3, minBottleSelection: 0, maxBottleSelection: 3,
  enabled: true, sortOrder: 0, paymentMode: 'REQUEST_ONLY',
};
const eventId = '018f5e61-28ef-47c1-a1bb-6bde1489b777';
const bottleIds = [randomUUID(), randomUUID()];
let saved: typeof productionPackage;
let currentEvent: { id: string; vipDefaultPackageId: string | null };
beforeEach(() => {
  vi.resetAllMocks();
  saved = { ...productionPackage, enabled: false };
  currentEvent = { id: eventId, vipDefaultPackageId: null };
  mocks.event.mockImplementation(async () => ({ ...currentEvent }));
  mocks.eventUpdate.mockImplementation(async ({ data }) => {
    if (data.vipDefaultPackageId !== undefined) currentEvent.vipDefaultPackageId = data.vipDefaultPackageId;
    return { ...currentEvent };
  });
  mocks.find.mockImplementation(async ({ where }) => where.id === saved.id && where.eventId === eventId ? { ...saved } : null);
  mocks.update.mockImplementation(async ({ data }) => {
    saved = { ...saved, ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) };
    return { ...saved };
  });
  mocks.read.mockImplementation(async () => ({ ...saved, packageBottles: bottleIds.map((bottleOptionId) => ({ bottleOptionId })) }));
  mocks.bottles.mockImplementation(async ({ where }) => bottleIds.filter((id) => where.id.in.includes(id)).map((id) => ({ id })));
  mocks.clear.mockResolvedValue({ count: 2 }); mocks.assign.mockResolvedValue({ count: 2 });
  mocks.transaction.mockImplementation(async (callback) => callback({
    event: { update: mocks.eventUpdate },
    vipPackage: { findFirst: mocks.find, update: mocks.update, create: mocks.create, findUniqueOrThrow: mocks.read },
    bottleOption: { findMany: mocks.bottles },
    vipPackageBottle: { deleteMany: mocks.clear, createMany: mocks.assign },
  }));
});
describe('VIP admin identifier and persistence compatibility', () => {
  it('accepts the unchanged production-shaped seeded package identifier', () => {
    const parsed = vipPackageInput.safeParse(productionPackage);
    expect(parsed.success, JSON.stringify(parsed.error?.issues)).toBe(true);
  });
  it('accepts a random standard UUID and stable DB bottle identifiers', () => {
    expect(databaseUuid.safeParse(randomUUID()).success).toBe(true);
    expect(vipPackageInput.safeParse({ ...productionPackage, bottleOptionIds: [productionPackage.id] }).success).toBe(true);
  });
  it.each(['not-a-uuid', '00000000-0000-0000-0000-00000000000G', '00000000000000000000000000000001', productionPackage.id + ' '])('rejects malformed identifier %s', (id) => {
    expect(databaseUuid.safeParse(id).success).toBe(false);
  });
  it.each([true, false])('persists Enabled=%s without duplicating/changing the package', async (enabled) => {
    const result = await saveVipPackage(eventId, { ...productionPackage, enabled });
    expect(result).toMatchObject({ ...productionPackage, enabled });
    expect(saved.enabled).toBe(enabled);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('does not touch bottle relations when bottleOptionIds is omitted', async () => {
    await saveVipPackage(eventId, productionPackage);
    expect(mocks.clear).not.toHaveBeenCalled(); expect(mocks.assign).not.toHaveBeenCalled();
  });
  it('replaces explicitly supplied bottle assignments within one transaction', async () => {
    await saveVipPackage(eventId, { ...productionPackage, bottleOptionIds: bottleIds });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.assign).toHaveBeenCalledWith({ data: bottleIds.map((bottleOptionId) => ({ vipPackageId: productionPackage.id, bottleOptionId })) });
  });
  it('an explicit empty list clears assignments, not global BottleOptions', async () => {
    await saveVipPackage(eventId, { ...productionPackage, bottleOptionIds: [] });
    expect(mocks.clear).toHaveBeenCalledOnce(); expect(mocks.assign).not.toHaveBeenCalled();
  });
  it('rejects a missing bottle before writing package or assignments', async () => {
    await expect(saveVipPackage(eventId, { ...productionPackage, name: 'Do not persist', bottleOptionIds: [randomUUID()] })).rejects.toMatchObject({ status: 422, fieldErrors: { bottleOptionIds: expect.any(String) } });
    expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.clear).not.toHaveBeenCalled();
  });
  it('rejects duplicate bottle IDs before mutation', async () => {
    await expect(saveVipPackage(eventId, { ...productionPackage, bottleOptionIds: [bottleIds[0], bottleIds[0]] })).rejects.toMatchObject({ status: 422 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rejects inconsistent bottle selection limits', async () => {
    await expect(saveVipPackage(eventId, { ...productionPackage, maxBottleSelection: 4 })).rejects.toMatchObject({ status: 422, fieldErrors: { maxBottleSelection: expect.any(String) } });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('returns field validation as 422 instead of an unhandled ZodError/500', async () => {
    await expect(saveVipPackage(eventId, { ...productionPackage, name: '' })).rejects.toMatchObject({ status: 422, message: 'Some VIP fields need attention.', fieldErrors: { name: expect.any(String) } });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('rejects package update under another event', async () => {
    await expect(saveVipPackage(randomUUID(), productionPackage)).rejects.toMatchObject({ status: 404 });
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it('persists an event-owned default package with its stable identifier', async () => {
    expect(await updateVipSettings(eventId, { defaultPackageId: productionPackage.id })).toMatchObject({ defaultPackageId: productionPackage.id });
  });
  it('allows a disabled default selection without automatically enabling it', async () => {
    await updateVipSettings(eventId, { defaultPackageId: productionPackage.id });
    expect(saved.enabled).toBe(false); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('rejects a missing/foreign default before any settings write', async () => {
    await expect(updateVipSettings(eventId, { defaultPackageId: randomUUID() })).rejects.toMatchObject({ status: 422, fieldErrors: { defaultPackageId: expect.any(String) } });
    expect(mocks.eventUpdate).not.toHaveBeenCalled();
  });
  it('clears default only on an explicit None/null selection', async () => {
    currentEvent.vipDefaultPackageId = productionPackage.id;
    expect(await updateVipSettings(eventId, { defaultPackageId: null })).toMatchObject({ defaultPackageId: null });
  });
});
describe('admin error and visual package helpers', () => {
  it('maps the real nested API error, exact field error and support request ID', () => {
    expect(normalizeApiError(422, { error: { code: 'VALIDATION_ERROR', message: 'Some VIP fields need attention.', fieldErrors: { name: 'Package name required.' }, requestId: 'qa-vip-request-42' } })).toMatchObject({ message: 'Some VIP fields need attention.', fieldErrors: { name: 'Package name required.' }, requestId: 'qa-vip-request-42' });
  });
  it('ignores unsafe request ID data and preserves safe fallback messages', () => {
    expect(normalizeApiError(403, { error: { requestId: '<script>' } })).toMatchObject({ message: 'You do not have permission to do that.' });
    expect(normalizeApiError(403, { error: { requestId: '<script>' } }).requestId).toBeUndefined();
  });
  it.each([['3200.00', 320000], ['12.34', 1234], ['0', 0], ['0.1', 10], ['1.001', null], ['-1', null], ['3,200', null], ['9999999999', null]])('converts dollar input %s exactly', (value, minor) => {
    expect(dollarsToMinor(value as string)).toBe(minor);
  });
  it('omits unchanged assignments and editor-only money/relation metadata', () => {
    const row = { ...productionPackage, _priceDollars: '3200.00', _depositDollars: '', packageBottles: bottleIds.map((bottleOptionId) => ({ bottleOptionId })) };
    expect(assignedBottleIds(row)).toEqual(bottleIds);
    const body = packageSavePayload(row);
    expect(body.priceMinor).toBe(320000); expect(body.depositAmountMinor).toBeNull();
    expect(body).not.toHaveProperty('bottleOptionIds'); expect(body).not.toHaveProperty('packageBottles'); expect(body).not.toHaveProperty('_priceDollars');
    expect(packageSavePayload({ ...row, bottleOptionIds: [] }).bottleOptionIds).toEqual([]);
  });
  it.each(['abc', '-1', '1.001'])('invalid optional deposit %s remains a validation error, not a silent clear', (deposit) => {
    const parsed = vipPackageInput.safeParse(packageSavePayload({ ...productionPackage, _depositDollars: deposit }));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues.some((issue) => issue.path[0] === 'depositAmountMinor')).toBe(true);
  });
});
