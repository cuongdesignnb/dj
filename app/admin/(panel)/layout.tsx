import type { ReactNode } from 'react';
import AdminShell from '@/components/admin/layout/AdminShell';
import type { TopbarNotification } from '@/components/admin/layout/AdminTopbar';
import { requireAdmin } from '@/lib/admin/auth/session';
import { getEnvironmentBadge } from '@/lib/admin/common/config';
import { toClientSession } from '@/lib/admin/page-data';
import { getRepository } from '@/lib/admin/registry';

const TASK_LINKS: Record<string, string> = {
  events: '/admin/events',
  products: '/admin/products',
  content: '/admin/content/home',
  settings: '/admin/settings/site',
};

// The shell needs the user for the menu. Each page still checks the session
// and its own permission, because layouts are not re-run on navigation.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const tasks = await (await getRepository('tasks')).list({ page: 1, pageSize: 3 });
  const notifications: TopbarNotification[] = tasks.ok
    ? tasks.data.items.map((t) => ({
        id: t.id,
        title: String(t.title ?? ''),
        detail: 'Open task',
        href: TASK_LINKS[String(t.module)] ?? '/admin',
      }))
    : [];

  return (
    <AdminShell session={toClientSession(session)} environment={getEnvironmentBadge()} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
