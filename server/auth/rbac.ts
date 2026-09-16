import 'server-only';
import { requireAdminSession } from '@/server/auth/session';
import { forbidden } from '@/server/errors';
import { requestCsrfToken } from '@/server/security/csrf';

export async function requirePermission(request: Request, permission: string, mutation = false) {
  const session = await requireAdminSession(request);
  if (!session.permissions.has(permission)) throw forbidden();
  if (mutation) await requestCsrfToken(request);
  return session;
}

