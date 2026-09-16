import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import DataTable from '@/components/admin/ui/DataTable';
import { buttonClass } from '@/components/admin/ui/buttonClass';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { ResourceKey } from '@/lib/admin/common/resource';
import { gate, loadList } from '@/lib/admin/page-data';
import type { SearchParams } from '@/lib/admin/page-data';
import { ROUTED_RESOURCES, getResource } from '@/lib/admin/registry';

type Props = { params: Promise<{ resource: string }>; searchParams: Promise<SearchParams> };

function routed(key: string) {
  const definition = getResource(key);
  if (!definition || !ROUTED_RESOURCES.includes(key as ResourceKey)) notFound();
  return definition;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const definition = getResource((await params).resource);
  return { title: definition?.label ?? 'Not found' };
}

const NOTICES: Partial<Record<ResourceKey, string>> = {
  orders: 'Demo orders. Checkout is not connected, so there are no real orders or payments here.',
  staff: 'Invitations need the email service. Until it is connected, nobody receives an email from this screen.',
  roles: 'Permissions here control what the dashboard shows. The backend must enforce the same rules.',
};

export default async function ResourceListPage({ params, searchParams }: Props) {
  const definition = routed((await params).resource);
  const { session, allowed } = await gate(`${definition.permission}.view` as Permission);
  if (!allowed) return <AccessDenied />;

  const view = await loadList(definition, await searchParams, session);
  const canCreate = !!definition.form && can(session, `${definition.permission}.create` as Permission);
  const bulk = {
    archive: definition.actions.includes('archive') && can(session, `${definition.permission}.edit` as Permission),
    delete: definition.actions.includes('delete') && can(session, `${definition.permission}.delete` as Permission),
  };
  const addLabel = definition.key === 'staff' ? 'Invite Staff' : `Add ${definition.singular}`;
  const notice = definition.key === 'orders' && !session.mock ? undefined : NOTICES[definition.key];

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow={definition.group}
        title={definition.label}
        description={definition.description}
        trail={[{ label: 'Dashboard', href: '/admin' }, { label: definition.group }, { label: definition.label }]}
        actions={
          canCreate ? (
            <Link href={`${definition.basePath}/new`} className={buttonClass.primary}>
              <Plus aria-hidden className="h-4 w-4" /> {addLabel}
            </Link>
          ) : undefined
        }
      />
      <DataTable
        resourceKey={definition.key}
        label={definition.label}
        columns={view.columns}
        rows={view.rows}
        total={view.total}
        page={view.page}
        pageSize={view.pageSize}
        query={view.query}
        filters={definition.filters}
        error={view.error}
        bulk={bulk}
        notice={notice}
        empty={{
          title: definition.empty.title,
          description: definition.empty.description,
          action: canCreate ? { label: addLabel, href: `${definition.basePath}/new` } : undefined,
        }}
      />
    </PageReveal>
  );
}
