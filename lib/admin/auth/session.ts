// Server-side admin session lookup. Authorization is owned by the database
// session/RBAC layer.

import { db } from '@/server/db/client';
import { getAdminSession as getBackendAdminSession } from '@/server/auth/session';
import { redirect } from 'next/navigation';
import { hasPermission } from './permissions';
import type { Permission } from './permissions';

export const SESSION_COOKIE = 'destiny_admin_session';

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
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const backend = await getBackendAdminSession();
  if (!backend) return null;
  const assignment = await db.userRole.findFirst({ where: { userId: backend.user.id }, include: { role: true } });
  return {
    user: { id: backend.user.id, name: backend.user.name, email: backend.user.email, roleId: assignment?.roleId ?? '', roleName: assignment?.role.name ?? 'Administrator' },
    permissions: [...backend.permissions],
  };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export function can(session: AdminSession, permission?: Permission): boolean {
  return hasPermission(session.permissions, permission);
}
