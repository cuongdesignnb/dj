// Pipe into the QA app after db:seed:preview. This cannot run on a production DB.
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const database = new URL(process.env.DATABASE_URL || 'postgresql://localhost/undefined');
if (process.env.GALLERY_QA !== '1' || database.pathname !== '/destiny_gallery_qa') {
  throw new Error('Gallery fixtures require the isolated destiny_gallery_qa database and GALLERY_QA=1.');
}
const db = new PrismaClient();
try {
  const passwordHash = await argon2.hash('Gallery-QA-Only-2026!');
  for (const [label, roleKey] of [['editor', 'EDITOR'], ['viewer', 'VIEWER']]) {
    const role = await db.role.findUniqueOrThrow({ where: { key: roleKey } });
    const user = await db.adminUser.upsert({
      where: { email: `qa-${label}@example.test` },
      update: { passwordHash, status: 'ACTIVE' },
      create: { email: `qa-${label}@example.test`, name: `Gallery QA ${label}`, passwordHash, status: 'ACTIVE' },
    });
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {}, create: { userId: user.id, roleId: role.id },
    });
  }
  for (const [key, mimeType, deletedAt] of [
    ['qa/non-image.pdf', 'application/pdf', null],
    ['qa/deleted-image.jpg', 'image/jpeg', new Date()],
  ]) {
    await db.mediaAsset.upsert({
      where: { storageKey: key }, update: { deletedAt },
      create: { storageDriver: 'LOCAL', storageKey: key, publicUrl: `/${key}`, mimeType, altText: 'Gallery QA invalid-media fixture', sizeBytes: 0, deletedAt },
    });
  }
  console.log('Gallery QA editor/viewer and invalid-media fixtures ready. No uploads performed.');
} finally {
  await db.$disconnect();
}
