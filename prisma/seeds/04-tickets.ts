import type { SeedContext } from './context';
import { TICKET_TIERS } from './context';

export async function seedTickets({ db }: SeedContext, eventId: string) {
  for (const tier of TICKET_TIERS) {
    const existing = await db.ticketTier.findFirst({ where: { eventId, name: tier.name } });
    if (existing) {
      await db.ticketTier.update({
        where: { id: existing.id },
        data: {
          priceMinor: tier.priceMinor,
          currency: 'AUD',
          availabilityStatus: 'UNKNOWN',
          providerName: null,
          providerExternalId: null,
          providerUrl: null,
          purchasableOnline: false,
          purchasableAtDoor: false,
          sortOrder: tier.sortOrder,
          enabled: true,
        },
      });
    } else {
      await db.ticketTier.create({
        data: {
          eventId,
          name: tier.name,
          priceMinor: tier.priceMinor,
          currency: 'AUD',
          availabilityStatus: 'UNKNOWN',
          providerName: null,
          providerExternalId: null,
          providerUrl: null,
          purchasableOnline: false,
          purchasableAtDoor: false,
          sortOrder: tier.sortOrder,
          enabled: true,
        },
      });
    }
  }
}
