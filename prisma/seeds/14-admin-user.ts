import argon2 from 'argon2';
import type { SeedContext } from './context';

export async function seedAdminUser({ db }: SeedContext, roles: Map<string, { id: string }>) {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log('[seed] ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are not set; no admin user created.');
    return;
  }
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await db.adminUser.upsert({
    where: { email },
    update: { name: 'Site administrator', passwordHash, status: 'ACTIVE' },
    create: { email, name: 'Site administrator', passwordHash, status: 'ACTIVE', locale: 'en' },
  });
  const role = roles.get('SUPER_ADMIN');
  if (role) {
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }
}
