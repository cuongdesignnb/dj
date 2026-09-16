import { f, opts, section } from '@/lib/admin/common/fields';
import type { ResourceDefinition } from '@/lib/admin/common/resource';

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
  seed: () => [],
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
