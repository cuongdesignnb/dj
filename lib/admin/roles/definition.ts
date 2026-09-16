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
  seed: () => [],
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
