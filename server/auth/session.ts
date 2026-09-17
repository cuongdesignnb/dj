import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/server/db/client';
import { runtimeConfig } from '@/server/config';
import { unauthorized } from '@/server/errors';
import { hashCsrf } from '@/server/security/csrf';

const SESSION_DAYS = 7;

function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function secureCookie(config: ReturnType<typeof runtimeConfig>) {
  return config.appUrl.startsWith('https://');
}

function cookieValue(request?: Request) {
  if (request) {
    const raw = request.headers.get('cookie') ?? '';
    const match = raw.match(new RegExp(`(?:^|;\\s*)${runtimeConfig().sessionCookieName}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
  return null;
}

export type AdminSession = {
  id: string;
  user: { id: string; email: string; name: string; locale: string };
  permissions: Set<string>;
  csrfHash: string;
};

export async function createAdminSession(userId: string, response: Response, remember = false) {
  const config = runtimeConfig();
  const token = randomBytes(32).toString('hex');
  const csrfToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + (remember ? 30 : SESSION_DAYS) * 86_400_000);
  const session = await db.adminSession.create({
    data: { userId, tokenHash: hashToken(token), csrfHash: hashCsrf(csrfToken), expiresAt },
  });
  const secure = secureCookie(config);
  const cookieOptions = `Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${Math.floor((expiresAt.getTime() - Date.now()) / 1000)}`;
  response.headers.append('Set-Cookie', `${config.sessionCookieName}=${encodeURIComponent(token)}; ${cookieOptions}`);
  response.headers.append('Set-Cookie', `${config.csrfCookieName}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${Math.floor((expiresAt.getTime() - Date.now()) / 1000)}`);
  return { sessionId: session.id, csrfToken };
}

export async function getAdminSession(request?: Request): Promise<AdminSession | null> {
  const token = cookieValue(request) ?? (await cookies()).get(runtimeConfig().sessionCookieName)?.value ?? null;
  if (!token) return null;
  const row = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } } } },
  });
  if (!row || row.expiresAt <= new Date() || row.user.status !== 'ACTIVE') {
    if (row) await db.adminSession.delete({ where: { id: row.id } }).catch(() => undefined);
    return null;
  }
  await db.adminSession.update({ where: { id: row.id }, data: { lastSeenAt: new Date() } });
  const permissions = new Set(row.user.userRoles.flatMap((item) => item.role.rolePermissions.map((grant) => grant.permission.key)));
  return { id: row.id, user: { id: row.user.id, email: row.user.email, name: row.user.name, locale: row.user.locale }, permissions, csrfHash: row.csrfHash };
}

export async function requireAdminSession(request: Request) {
  const session = await getAdminSession(request);
  if (!session) throw unauthorized();
  return session;
}

export async function destroyAdminSession(request: Request, response: Response) {
  const config = runtimeConfig();
  const token = cookieValue(request);
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  const secure = secureCookie(config);
  response.headers.append('Set-Cookie', `${config.sessionCookieName}=; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=0`);
  response.headers.append('Set-Cookie', `${config.csrfCookieName}=; Path=/; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=0`);
}

export async function destroyAdminSessionFromCookies() {
  const config = runtimeConfig();
  const jar = await cookies();
  const token = jar.get(config.sessionCookieName)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(config.sessionCookieName);
  jar.delete(config.csrfCookieName);
}
