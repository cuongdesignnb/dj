import { PrismaClient } from '@prisma/client';

import { isPreviewEnabled, registerRequiredMedia } from './seeds/context';
import { seedSystem } from './seeds/01-system';
import { seedEvent } from './seeds/02-events';
import { seedArtists } from './seeds/03-artists';
import { seedTickets } from './seeds/04-tickets';
import { seedVip } from './seeds/05-vip';
import { seedPartners } from './seeds/06-partners';
import { seedProducts } from './seeds/07-products';
import { seedContentPages } from './seeds/08-content-pages';
import { seedFaq } from './seeds/09-faq';
import { seedLegal } from './seeds/10-legal';
import { seedNewsPreview } from './seeds/11-news-preview';
import { seedGalleryPreview } from './seeds/12-gallery-preview';
import { seedSettings } from './seeds/13-settings';
import { seedAdminUser } from './seeds/14-admin-user';

const db = new PrismaClient();

async function main() {
  const preview = isPreviewEnabled();
  await db.$transaction(async (tx) => {
    const context = { db: tx, preview };
    const { roles } = await seedSystem(context);
    await registerRequiredMedia(tx);
    const event = await seedEvent(context);
    await seedArtists(context, event.id);
    await seedTickets(context, event.id);
    await seedVip(context, event.id);
    await seedPartners(context);
    await seedProducts(context);
    await seedContentPages(context);
    await seedFaq(context, event.id);
    await seedLegal(context);
    await seedNewsPreview(context, event.id);
    await seedGalleryPreview(context, event.id);
    await seedSettings(context);
    await seedAdminUser(context, roles);
  });

  console.log(`[seed] bootstrap complete (preview content: ${preview ? 'enabled' : 'disabled'}).`);
}

main()
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
