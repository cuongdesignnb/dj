import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

// DEMO STAFF. Obvious placeholder people at example.com; no invitation email
// is ever sent from this screen without a backend.

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'invited' | 'disabled';
  language: 'en' | 'vi';
  lastActiveAt: string | null;
  updatedAt: string;
  [key: string]: unknown;
}

export const STAFF_STATUS = opts(['active', 'Active'], ['invited', 'Invited'], ['disabled', 'Disabled']);

const person = (
  id: string,
  name: string,
  roleId: string,
  status: AdminStaff['status'],
  lastActiveAt: string | null,
): AdminStaff => ({
  id,
  name,
  email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`,
  roleId,
  status,
  language: 'en',
  lastActiveAt,
  updatedAt: '2026-09-01T09:00:00.000Z',
});

export const staffDefinition: ResourceDefinition<AdminStaff> = {
  key: 'staff',
  label: 'Staff Management',
  singular: 'Staff member',
  description: 'Manage who can access the admin panel.',
  group: 'Team & Access',
  basePath: '/admin/staff',
  apiPath: 'staff',
  permission: 'staff',
  titleKey: 'name',
  idPrefix: 'staff',
  seed: () => [
    { ...person('staff_admin_1', 'Demo Admin', 'role_super_admin', 'active', '2026-09-16T08:00:00.000Z'), email: 'admin@demo.local' },
    person('staff_admin_2', 'Demo Admin Two', 'role_admin', 'active', '2026-09-14T11:30:00.000Z'),
    person('staff_manager_1', 'Demo Manager', 'role_manager', 'active', '2026-09-13T16:10:00.000Z'),
    person('staff_editor_1', 'Demo Editor One', 'role_editor', 'active', '2026-09-15T09:45:00.000Z'),
    person('staff_editor_2', 'Demo Editor Two', 'role_editor', 'invited', null),
    person('staff_viewer_1', 'Demo Viewer', 'role_viewer', 'disabled', '2026-08-28T13:00:00.000Z'),
  ],
  searchFields: ['name', 'email'],
  defaultSort: { key: 'name', direction: 'asc' },
  filters: [
    { key: 'status', label: 'Status', options: STAFF_STATUS },
    {
      key: 'roleId',
      label: 'Role',
      options: opts(['role_super_admin', 'Super Admin'], ['role_admin', 'Admin'], ['role_manager', 'Manager'], ['role_editor', 'Editor'], ['role_viewer', 'Viewer']),
    },
  ],
  columns: [
    { key: 'name', label: 'Name', type: 'title', sortable: true },
    { key: 'email', label: 'Email', type: 'text' },
    { key: '_view.role', label: 'Role', type: 'text' },
    { key: 'status', label: 'Status', type: 'status', sortable: true },
    { key: 'lastActiveAt', label: 'Last Active', type: 'datetime', sortable: true, hideOnMobile: true },
  ],
  actions: ['edit', 'delete'],
  hasDetail: false,
  statusKey: 'status',
  empty: { title: 'No staff yet.', description: 'Invite the first team member.' },
  newRecord: () => ({ name: '', email: '', roleId: 'role_editor', status: 'invited', language: 'en', lastActiveAt: null }),
  form: {
    titleKey: 'name',
    seo: false,
    publish: null,
    sections: [
      section('person', 'Staff member', [
        f.text('name', 'Name', { required: true, width: 'half', maxLength: 80 }),
        f.email('email', 'Email', { required: true }),
        { key: 'roleId', label: 'Role', type: 'select', optionSource: 'roles', required: true, width: 'half' },
        f.select('status', 'Status', STAFF_STATUS, { required: true }),
        f.select('language', 'Admin language', opts(['en', 'English'], ['vi', 'Tiếng Việt'])),
      ]),
    ],
  },
};
