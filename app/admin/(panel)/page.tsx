import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays,
  CalendarPlus,
  FileText,
  ImagePlus,
  Mic2,
  Newspaper,
  Package,
  PackagePlus,
  PenLine,
  Plug,
  ShoppingBag,
  UserPlus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import AdminCard from '@/components/admin/ui/AdminCard';
import { PageReveal, StaggerGrid, StaggerItem } from '@/components/admin/ui/Reveal';
import { AccessDenied, EmptyState } from '@/components/admin/ui/States';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { can } from '@/lib/admin/auth/session';
import type { AdminSession } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { ResourceKey } from '@/lib/admin/common/resource';
import { formatDate, formatRelative, textOf } from '@/lib/admin/common/table';
import type { AdminRecord } from '@/lib/admin/common/types';
import { formatMoney } from '@/lib/money';
import type { Money } from '@/lib/money';
import { gate } from '@/lib/admin/page-data';
import { RESOURCES, getRepository, getSingletonRepository } from '@/lib/admin/registry';

export const metadata: Metadata = { title: 'Dashboard' };

async function records(key: ResourceKey, pageSize = 200): Promise<AdminRecord[] | null> {
  const result = await (await getRepository(key)).list({ page: 1, pageSize });
  return result.ok ? result.data.items : null;
}

function countBy(items: AdminRecord[], key: string) {
  const out: Record<string, number> = {};
  for (const item of items) {
    const v = String(item[key] ?? 'unknown');
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

interface Kpi {
  label: string;
  value: string;
  detail: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}

const QUICK: { label: string; href: string; icon: LucideIcon; permission: Permission }[] = [
  { label: 'Create Event', href: '/admin/events/new', icon: CalendarPlus, permission: 'events.create' },
  { label: 'Add Artist', href: '/admin/artists/new', icon: Mic2, permission: 'artists.create' },
  { label: 'Add Product', href: '/admin/products/new', icon: PackagePlus, permission: 'products.create' },
  { label: 'Write Article', href: '/admin/news/new', icon: PenLine, permission: 'news.create' },
  { label: 'New Album', href: '/admin/gallery/new', icon: ImagePlus, permission: 'gallery.create' },
  { label: 'Invite Staff', href: '/admin/staff/new', icon: UserPlus, permission: 'staff.create' },
];

const OVERVIEW: { key: ResourceKey; icon: LucideIcon }[] = [
  { key: 'events', icon: CalendarDays },
  { key: 'artists', icon: Mic2 },
  { key: 'products', icon: Package },
  { key: 'news', icon: Newspaper },
  { key: 'gallery', icon: ImagePlus },
  { key: 'partners', icon: Users },
];

const TASK_HREF: Record<string, string> = {
  events: '/admin/events',
  products: '/admin/products',
  content: '/admin/content/home',
  settings: '/admin/settings/integrations',
};

function kpis(session: AdminSession, data: Record<string, AdminRecord[] | null>): Kpi[] {
  const summary = (key: string) => {
    const items = data[key];
    if (!items) return { value: '—', detail: 'Could not load' };
    const counts = countBy(items, RESOURCES[key as ResourceKey].statusKey ?? 'status');
    const order = ['published', 'preview', 'draft', 'archived'];
    const detail = Object.entries(counts)
      .sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))
      .map(([status, n]) => `${n} ${status}`)
      .join(' · ');
    return { value: String(items.length), detail: detail || 'None yet' };
  };
  const orders = data.orders;
  const staff = data.staff;
  const list: Kpi[] = [
    { label: 'Events', ...summary('events'), href: '/admin/events', icon: CalendarDays, permission: 'events.view' },
    { label: 'Artists', ...summary('artists'), href: '/admin/artists', icon: Mic2, permission: 'artists.view' },
    { label: 'Products', ...summary('products'), href: '/admin/products', icon: Package, permission: 'products.view' },
    {
      label: 'Orders',
      value: orders ? String(orders.length) : '—',
      detail: orders
        ? `${orders.filter((o) => o.paymentStatus === 'paid').length} paid · ${orders.filter((o) => o.paymentStatus === 'paid' && (o.fulfillmentStatus === 'unfulfilled' || o.fulfillmentStatus === 'processing')).length} to fulfil`
        : 'Could not load',
      href: '/admin/orders',
      icon: ShoppingBag,
      permission: 'orders.view',
    },
    { label: 'News', ...summary('news'), href: '/admin/news', icon: FileText, permission: 'news.view' },
    {
      label: 'Staff',
      value: staff ? String(staff.length) : '—',
      detail: staff ? `${staff.filter((s) => s.status === 'active').length} active · ${staff.filter((s) => s.status === 'invited').length} invited` : 'Could not load',
      href: '/admin/staff',
      icon: Users,
      permission: 'staff.view',
    },
  ];
  return list.filter((k) => can(session, k.permission));
}

export default async function AdminDashboardPage() {
  const { session, allowed } = await gate('dashboard.view');
  if (!allowed) return <AccessDenied />;

  const keys: ResourceKey[] = ['events', 'artists', 'products', 'orders', 'news', 'gallery', 'partners', 'staff', 'roles'];
  const loaded = await Promise.all(
    keys.map((k) => (can(session, `${RESOURCES[k].permission}.view` as Permission) ? records(k) : Promise.resolve(null))),
  );
  const data = Object.fromEntries(keys.map((k, i) => [k, loaded[i]])) as Record<string, AdminRecord[] | null>;
  const [audit, tasks] = await Promise.all([records('audit', 6), records('tasks', 5)]);
  const integrations = can(session, 'settings.view') ? await (await getSingletonRepository('settings-integrations')).get() : null;

  const latestOrders = [...(data.orders ?? [])].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
  const firstName = session.user.name.split(' ')[0] || session.user.name;

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow="Connection Rave"
        title="Dashboard"
        trail={[{ label: 'Dashboard' }]}
        description={`Welcome back, ${firstName}. Here is where things stand.`}
        tagline="Music meets soul"
      />

      <StaggerGrid className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {kpis(session, data).map((k) => (
          <StaggerItem key={k.label}>
            <Link
              href={k.href}
              className="group flex h-full items-start gap-3 rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 transition-colors hover:border-rave-red/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-rave-red/10 text-rave-red">
                <k.icon aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-admin-muted">
                  {k.label}
                </span>
                <span className="mt-1 block font-heading text-3xl font-bold leading-none text-white">{k.value}</span>
                <span className="mt-1.5 block truncate text-xs text-admin-muted">{k.detail}</span>
              </span>
            </Link>
          </StaggerItem>
        ))}
      </StaggerGrid>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <AdminCard title="Quick Actions" titleId="quick-actions">
          <ul className="grid grid-cols-2 gap-2">
            {QUICK.filter((q) => can(session, q.permission)).map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="flex min-h-[64px] flex-col items-start justify-center gap-1.5 rounded-[10px] border border-admin-border bg-admin-deep px-3 py-2.5 text-sm text-white transition-colors hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                >
                  <q.icon aria-hidden className="h-4 w-4 text-rave-red" />
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Management Overview" titleId="overview" className="xl:col-span-2">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OVERVIEW.filter((o) => can(session, `${RESOURCES[o.key].permission}.view` as Permission)).map((o) => {
              const def = RESOURCES[o.key];
              const items = data[o.key];
              const counts = items ? countBy(items, def.statusKey ?? 'status') : {};
              return (
                <li key={o.key}>
                  <Link
                    href={def.basePath}
                    className="flex h-full flex-col rounded-[10px] border border-admin-border bg-admin-deep p-3 transition-colors hover:border-rave-red/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                  >
                    <span className="flex items-center gap-2 font-medium text-white">
                      <o.icon aria-hidden className="h-4 w-4 text-admin-muted" />
                      {def.label}
                    </span>
                    <span className="mt-1 text-xs text-admin-muted">{def.description}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {items === null ? (
                        <span className="text-xs text-admin-muted">Could not load</span>
                      ) : Object.keys(counts).length === 0 ? (
                        <span className="text-xs text-admin-muted">Nothing yet</span>
                      ) : (
                        Object.entries(counts).map(([status, n]) => <StatusBadge key={status} value={status} label={`${n} ${status}`} />)
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </AdminCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AdminCard title="Recent Activity" titleId="activity">
          {!audit || audit.length === 0 ? (
            <EmptyState title="No recent activity." />
          ) : (
            <ol className="space-y-3">
              {audit.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rave-red" />
                  <span className="min-w-0">
                    <span className="text-white">
                      <span className="font-medium">{String(a.actorName)}</span> {String(a.action)}{' '}
                      {a.entityLabel ? <span className="text-white/85">&ldquo;{String(a.entityLabel)}&rdquo;</span> : null}
                    </span>
                    <span className="block text-xs text-admin-muted">
                      <time dateTime={String(a.createdAt)}>{formatRelative(String(a.createdAt))}</time>
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </AdminCard>

        <AdminCard title="Content Queue" titleId="queue">
          {!tasks || tasks.length === 0 ? (
            <EmptyState title="Nothing queued." />
          ) : (
            <ul className="divide-y divide-admin-border">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                  <Link
                    href={TASK_HREF[String(t.module)] ?? '/admin'}
                    className="min-w-0 truncate text-white hover:text-rave-red focus:outline-none focus-visible:underline"
                  >
                    {String(t.title)}
                  </Link>
                  <span className="shrink-0 text-xs text-admin-muted">Due {formatDate(t.dueAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {can(session, 'orders.view') && (
          <AdminCard
            title="Latest Orders"
            titleId="orders"
            action={{ label: 'View all', href: '/admin/orders' }}
            className="xl:col-span-2"
          >
            {latestOrders.length === 0 ? (
              <EmptyState title="No orders yet." description="Orders appear here once checkout is connected." />
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <caption className="sr-only">Latest orders</caption>
                  <thead>
                    <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                      <th scope="col" className="py-2 pr-3 font-medium">Order</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Customer</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Total</th>
                      <th scope="col" className="py-2 pr-3 font-medium">Payment</th>
                      <th scope="col" className="py-2 font-medium">Fulfilment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestOrders.map((o) => (
                      <tr key={o.id} className="border-b border-admin-border/60 last:border-0">
                        <td className="py-2.5 pr-3">
                          <Link href={`/admin/orders/${o.id}`} className="font-medium text-white hover:text-rave-red focus:outline-none focus-visible:underline">
                            {String(o.orderNumber)}
                          </Link>
                          <span className="block text-xs text-admin-muted">{formatDate(o.createdAt)}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-white/85">{String(o.customerName)}</td>
                        <td className="py-2.5 pr-3 text-white/85">{formatMoney(o.total as Money)}</td>
                        <td className="py-2.5 pr-3">
                          <StatusBadge value={String(o.paymentStatus)} />
                        </td>
                        <td className="py-2.5">
                          <StatusBadge value={String(o.fulfillmentStatus)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminCard>
        )}

        <div className="space-y-5">
          {can(session, 'roles.view') && data.roles && (
            <AdminCard title="Team & Roles" titleId="roles" action={{ label: 'Manage', href: '/admin/roles' }}>
              <ul className="space-y-2 text-sm">
                {data.roles.map((r) => {
                  const members = (data.staff ?? []).filter((s) => s.roleId === r.id).length;
                  return (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="text-white">{textOf(r.name)}</span>
                      <span className="text-xs text-admin-muted">{data.staff ? `${members} ${members === 1 ? 'member' : 'members'}` : '—'}</span>
                    </li>
                  );
                })}
              </ul>
            </AdminCard>
          )}

          {integrations && (
            <AdminCard title="Integrations" titleId="integrations" action={{ label: 'Configure', href: '/admin/settings/integrations' }}>
              {integrations.ok ? (
                <ul className="space-y-2 text-sm">
                  {((integrations.data.items as Record<string, unknown>[] | undefined) ?? []).map((i) => (
                    <li key={String(i.id)} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-white">
                        <Plug aria-hidden className="h-3.5 w-3.5 text-admin-muted" />
                        {String(i.name)}
                      </span>
                      <StatusBadge value={String(i.state)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-admin-muted">Integration status is unavailable.</p>
              )}
            </AdminCard>
          )}
        </div>
      </div>
    </PageReveal>
  );
}
