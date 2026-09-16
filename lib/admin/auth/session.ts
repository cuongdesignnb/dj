// Admin session lookup — the data-access-layer check every admin page and
// server action calls. Layouts are not relied on: they do not re-render on
// client navigation.
//
// Mock mode (NEXT_PUBLIC_ADMIN_MOCK_AUTH=true with mock data) signs in a demo
// user with demo credentials. It is a development convenience and grants no
// access to anything real. In api mode the backend validates the session.

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiRequest } from '@/lib/api/client';
import { getAdminDataSource, getApiBaseUrl, isMockAuthEnabled } from '@/lib/admin/common/config';
import { getRepository } from '@/lib/admin/registry';
import { hasPermission, isPermission } from './permissions';
import type { Permission } from './permissions';

export const SESSION_COOKIE = 'cr_admin_session';

export const DEMO_CREDENTIALS = {
  email: 'admin@demo.local',
  password: 'demo-admin',
  staffId: 'staff_admin_1',
};

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
}

export interface AdminSession {
  user: AdminUser;
  permissions: string[];
  mock: boolean;
}

async function mockSession(value: string): Promise<AdminSession | null> {
  const staffId = value.startsWith('mock:') ? value.slice(5) : '';
  const staff = await (await getRepository('staff')).get(staffId);
  if (!staff.ok || !staff.data || staff.data.status !== 'active') return null;
  const roleId = String(staff.data.roleId ?? '');
  const role = await (await getRepository('roles')).get(roleId);
  const permissions = role.ok && role.data && Array.isArray(role.data.permissions)
    ? (role.data.permissions as string[]).filter(isPermission)
    : [];
  return {
    user: {
      id: staff.data.id,
      name: String(staff.data.name ?? ''),
      email: String(staff.data.email ?? ''),
      roleId,
      roleName: role.ok && role.data ? String(role.data.name ?? '') : 'Unknown role',
    },
    permissions,
    mock: true,
  };
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  const value = jar.get(SESSION_COOKIE)?.value;

  if (isMockAuthEnabled()) {
    return value ? mockSession(value) : null;
  }

  if (getAdminDataSource() !== 'api') return null;

  // The backend owns the session; forward the browser's cookies to it.
  const result = await apiRequest<{ user?: AdminUser; permissions?: string[] }>(
    getApiBaseUrl(),
    '/api/v1/admin/session',
    { cookie: jar.toString() },
  );
  if (!result.ok || !result.data?.user) return null;
  return {
    user: result.data.user,
    permissions: (result.data.permissions ?? []).filter(isPermission),
    mock: false,
  };
}

/** Redirects to sign-in when there is no session. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export function can(session: AdminSession, permission?: Permission): boolean {
  return hasPermission(session.permissions, permission);
}
