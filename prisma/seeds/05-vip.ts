import type { SeedContext } from './context';
import { BOOTH_CODES, BOTTLES } from './context';

const VIP_PACKAGE_ID = '00000000-0000-0000-0000-000000000001';

export async function seedVip({ db }: SeedContext, eventId: string) {
  const vip = await db.vipPackage.upsert({
    where: { id: VIP_PACKAGE_ID },
    update: { eventId, name: 'BOOTH PACKAGE', priceMinor: 320000, capacity: 15, includedBottleCount: 3, enabled: true, sortOrder: 0 },
    create: { id: VIP_PACKAGE_ID, eventId, name: 'BOOTH PACKAGE', priceMinor: 320000, currency: 'AUD', capacity: 15, includedBottleCount: 3, enabled: true, sortOrder: 0 },
  });

  for (const [sortOrder, code] of BOOTH_CODES.entries()) {
    const existing = await db.vipBooth.findUnique({ where: { eventId_code: { eventId, code } } });
    if (existing) {
      await db.vipBooth.update({ where: { id: existing.id }, data: { requestable: true, availabilityStatus: 'ON_REQUEST', sortOrder } });
    } else {
      await db.vipBooth.create({ data: { eventId, code, zone: null, requestable: true, availabilityStatus: 'ON_REQUEST', sortOrder } });
    }
  }

  for (const [sortOrder, name] of BOTTLES.entries()) {
    const bottle = await db.bottleOption.upsert({
      where: { name },
      update: { enabled: true, sortOrder },
      create: { name, enabled: true, sortOrder },
    });
    await db.vipPackageBottle.upsert({
      where: { vipPackageId_bottleOptionId: { vipPackageId: vip.id, bottleOptionId: bottle.id } },
      update: {},
      create: { vipPackageId: vip.id, bottleOptionId: bottle.id },
    });
  }
  return vip;
}
