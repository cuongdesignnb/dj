import type { SeedContext } from './context';
import { LOCALES } from './context';

const PERMISSION_KEYS = [
  'events.view', 'events.create', 'events.edit', 'events.publish', 'events.delete',
  'artists.view', 'artists.create', 'artists.edit', 'artists.publish', 'artists.delete',
  'products.view', 'products.create', 'products.edit', 'products.publish', 'products.delete',
  'orders.view', 'orders.create', 'orders.edit', 'orders.publish', 'orders.delete', 'orders.notes',
  'news.view', 'news.create', 'news.edit', 'news.publish', 'news.delete',
  'gallery.view', 'gallery.create', 'gallery.edit', 'gallery.publish', 'gallery.delete',
  'media.view', 'media.create', 'media.edit', 'media.delete',
  'content.view', 'content.create', 'content.edit', 'content.publish', 'content.delete',
  'partners.view', 'partners.create', 'partners.edit', 'partners.publish', 'partners.delete',
  'staff.view', 'staff.create', 'staff.edit', 'staff.disable',
  'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
  'settings.view', 'settings.edit',
] as const;

const ROLE_DEFINITIONS = [
  ['SUPER_ADMIN', 'Super administrator'],
  ['ADMIN', 'Administrator'],
  ['MANAGER', 'Content manager'],
  ['EDITOR', 'Editor'],
  ['VIEWER', 'Viewer'],
] as const;

const PRODUCT_CATEGORIES = [
  ['apparel', 'Apparel'],
  ['accessories', 'Accessories'],
  ['posters', 'Posters'],
] as const;

const FAQ_CATEGORIES = [
  ['tickets', 'Tickets', 'ticket'],
  ['vip-tables', 'VIP Tables', 'crown'],
  ['schedule', 'Schedule', 'clock'],
] as const;

export async function seedSystem({ db }: SeedContext) {
  for (const locale of LOCALES) {
    await db.locale.upsert({
      where: { code: locale.code },
      update: { name: locale.name, enabled: true, isDefault: locale.isDefault },
      create: { code: locale.code, name: locale.name, enabled: true, isDefault: locale.isDefault },
    });
  }

  const permissionRows = new Map<string, { id: string }>();
  for (const key of PERMISSION_KEYS) {
    const [module, action] = key.split('.');
    const row = await db.permission.upsert({
      where: { key },
      update: { module, action },
      create: { key, module, action },
    });
    permissionRows.set(key, row);
  }

  const roles = new Map<string, { id: string }>();
  for (const [key, name] of ROLE_DEFINITIONS) {
    const row = await db.role.upsert({
      where: { key },
      update: { name, isSystem: true },
      create: { key, name, isSystem: true },
    });
    roles.set(key, row);
  }

  const allPermissionIds = [...permissionRows.values()].map((row) => row.id);
  const adminPermissionIds = [...permissionRows.entries()]
    .filter(([key]) => !key.startsWith('roles.') && !key.startsWith('staff.'))
    .map(([, row]) => row.id);
  const managerPermissionIds = [...permissionRows.entries()]
    .filter(([key]) => /^(events|artists|products|news|gallery|media|content|partners)\./.test(key))
    .map(([, row]) => row.id);
  const editorPermissionIds = [...permissionRows.entries()]
    .filter(([key]) => /\.(view|create|edit)$/.test(key) && !key.startsWith('orders.'))
    .map(([, row]) => row.id);
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: allPermissionIds,
    ADMIN: adminPermissionIds,
    MANAGER: managerPermissionIds,
    EDITOR: editorPermissionIds,
    VIEWER: [...permissionRows.entries()].filter(([key]) => key.endsWith('.view')).map(([, row]) => row.id),
  };
  for (const [roleKey, ids] of Object.entries(rolePermissions)) {
    const role = roles.get(roleKey);
    if (!role) continue;
    for (const permissionId of ids) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  for (const [key, label] of PRODUCT_CATEGORIES) {
    await db.productCategory.upsert({ where: { key }, update: { label }, create: { key, label } });
  }

  for (const [index, [key, , icon]] of FAQ_CATEGORIES.entries()) {
    await db.faqCategory.upsert({
      where: { key },
      update: { icon, sortOrder: index },
      create: { key, icon, sortOrder: index },
    });
  }

  for (const provider of ['square', 'redis', 'brevo', 'mailchimp', 's3']) {
    await db.integrationSetting.upsert({
      where: { provider },
      update: {},
      create: { provider, status: 'NOT_CONFIGURED' },
    });
  }

  return { roles, permissionRows };
}
