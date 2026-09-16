// Permission vocabulary. The UI uses it to hide or disable controls; the
// backend MUST enforce the same rules — hiding a button protects nothing.

export const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'events', label: 'Events' },
  { id: 'artists', label: 'Artists' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'news', label: 'News' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'media', label: 'Media' },
  { id: 'content', label: 'Content' },
  { id: 'partners', label: 'Partners' },
  { id: 'staff', label: 'Staff' },
  { id: 'roles', label: 'Roles' },
  { id: 'settings', label: 'Settings' },
] as const;

export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'publish', 'delete', 'manage'] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number]['id'];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];
export type Permission = `${PermissionModule}.${PermissionAction}`;

export const ALL_PERMISSIONS: Permission[] = PERMISSION_MODULES.flatMap((m) =>
  PERMISSION_ACTIONS.map((a) => `${m.id}.${a}` as Permission),
);

export function hasPermission(granted: readonly string[], needed: Permission | undefined): boolean {
  if (!needed) return true;
  const [module] = needed.split('.');
  return granted.includes(needed) || granted.includes(`${module}.manage`);
}

export function isPermission(value: string): value is Permission {
  return (ALL_PERMISSIONS as string[]).includes(value);
}
