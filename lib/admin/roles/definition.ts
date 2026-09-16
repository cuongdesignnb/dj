import { ALL_PERMISSIONS, PERMISSION_MODULES } from '@/lib/admin/auth/permissions';
import type { Permission } from '@/lib/admin/auth/permissions';
import { f, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

// Example roles only. The permission sets below are a starting point for the
// business to adjust; the backend is the authority on what a role may do.

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  system: boolean;
  updatedAt: string;
  [key: string]: unknown;
}

const every = (...actions: string[]) =>
  PERMISSION_MODULES.flatMap((m) => actions.map((a) => `${m.id}.${a}` as Permission));

const modules = (ids: string[], actions: string[]) =>
  ids.flatMap((id) => actions.map((a) => `${id}.${a}` as Permission));

const CONTENT = ['dashboard', 'events', 'artists', 'products', 'news', 'gallery', 'media', 'content', 'partners'];

export const rolesDefinition: ResourceDefinition<AdminRole> = {
  key: 'roles',
  label: 'Roles & Permissions',
  singular: 'Role',
  description: 'Configure what each role can see and do.',
  group: 'Team & Access',
  basePath: '/admin/roles',
  apiPath: 'roles',
  permission: 'roles',
  titleKey: 'name',
  idPrefix: 'role',
  seed: () => [
    { id: 'role_super_admin', name: 'Super Admin', description: 'Full access, including roles and settings.', permissions: [...ALL_PERMISSIONS], system: true, updatedAt: '2026-09-01T09:00:00.000Z' },
    { id: 'role_admin', name: 'Admin', description: 'Everything except managing roles.', permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('roles.') || p === 'roles.view'), system: false, updatedAt: '2026-09-01T09:00:00.000Z' },
    { id: 'role_manager', name: 'Manager', description: 'Content, events, products and orders.', permissions: [...modules([...CONTENT, 'orders'], ['view', 'create', 'edit', 'publish', 'delete'])], system: false, updatedAt: '2026-09-01T09:00:00.000Z' },
    { id: 'role_editor', name: 'Editor', description: 'Create and edit content; no staff or settings.', permissions: modules(CONTENT, ['view', 'create', 'edit']), system: false, updatedAt: '2026-09-01T09:00:00.000Z' },
    { id: 'role_viewer', name: 'Viewer', description: 'Read-only access.', permissions: every('view'), system: false, updatedAt: '2026-09-01T09:00:00.000Z' },
  ],
  searchFields: ['name', 'description'],
  defaultSort: { key: 'name', direction: 'asc' },
  filters: [],
  columns: [
    { key: 'name', label: 'Role', type: 'title', subKey: 'description', sortable: true },
    { key: 'permissions', label: 'Permissions', type: 'count', align: 'center' },
    { key: 'system', label: 'Protected', type: 'bool', hideOnMobile: true },
    { key: 'updatedAt', label: 'Updated', type: 'date', hideOnMobile: true },
  ],
  actions: ['edit', 'duplicate', 'delete'],
  hasDetail: false,
  empty: { title: 'No roles yet.', description: 'Create a role to grant access.' },
  newRecord: () => ({ name: '', description: '', permissions: ['dashboard.view'], system: false }),
  form: {
    titleKey: 'name',
    seo: false,
    publish: null,
    sections: [
      section('role', 'Role', [
        f.text('name', 'Role name', { required: true, width: 'half', maxLength: 40 }),
        f.text('description', 'Description', { width: 'half', maxLength: 120 }),
      ]),
      section('permissions', 'Permission matrix', [{ key: 'permissions', label: 'Permissions', type: 'permissions' }], {
        description: 'This controls what the admin shows. The backend must enforce the same rules.',
      }),
    ],
  },
};
