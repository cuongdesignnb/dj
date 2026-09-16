'use client';

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { hasPermission } from '@/lib/admin/auth/permissions';
import type { Permission } from '@/lib/admin/auth/permissions';

export interface ClientSession {
  name: string;
  email: string;
  roleName: string;
  userId: string;
  permissions: string[];
}

const SessionContext = createContext<ClientSession | null>(null);

export function AdminSessionProvider({ session, children }: { session: ClientSession; children: ReactNode }) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useAdminSession(): ClientSession | null {
  return useContext(SessionContext);
}

export function useCan(permission?: Permission): boolean {
  const session = useContext(SessionContext);
  return !!session && hasPermission(session.permissions, permission);
}

/**
 * Hides (or swaps in a fallback for) UI the current role may not use.
 * This is presentation only — the server actions and the backend enforce
 * the same permission.
 */
export default function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
