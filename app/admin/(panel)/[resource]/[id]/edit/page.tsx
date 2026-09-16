import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eye } from 'lucide-react';
import ResourceForm from '@/components/admin/form/ResourceForm';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import StaffActions from '@/components/admin/modules/StaffActions';
import { buttonClass } from '@/components/admin/ui/buttonClass';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { ResourceKey } from '@/lib/admin/common/resource';
import { textOf } from '@/lib/admin/common/table';
import { gate, loadMediaChoices, loadOptionSets, optionSourcesOf, serpBase, updatedLabel } from '@/lib/admin/page-data';
import { ROUTED_RESOURCES, getRepository, getResource } from '@/lib/admin/registry';

type Props = { params: Promise<{ resource: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const definition = getResource((await params).resource);
  return { title: definition ? `Edit ${definition.singular.toLowerCase()}` : 'Not found' };
}

export default async function ResourceEditPage({ params }: Props) {
  const { resource, id } = await params;
  const definition = getResource(resource);
  if (!definition || !definition.form || !ROUTED_RESOURCES.includes(resource as ResourceKey)) notFound();

  const { session, allowed } = await gate(`${definition.permission}.view` as Permission);
  if (!allowed) return <AccessDenied />;

  const result = await (await getRepository(definition.key)).get(decodeURIComponent(id));
  if (!result.ok) {
    return <ErrorState title={`Could not load this ${definition.singular.toLowerCase()}`} message={result.error.message} />;
  }
  const record = result.data;
  if (!record) notFound();

  const [optionSets, media] = await Promise.all([loadOptionSets(optionSourcesOf(definition)), loadMediaChoices()]);
  const title = textOf(record[definition.titleKey]);
  const canEdit = can(session, `${definition.permission}.edit` as Permission);
  const preview =
    definition.key === 'news'
      ? `/admin/news/${record.id}/preview`
      : definition.actions.includes('preview')
        ? definition.publicPath?.(record) ?? null
        : null;

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow={`Edit ${definition.singular}`}
        title={title === '—' ? `Untitled ${definition.singular.toLowerCase()}` : title}
        trail={[
          { label: 'Dashboard', href: '/admin' },
          { label: definition.label, href: definition.basePath },
          { label: title },
        ]}
        actions={
          definition.hasDetail ? (
            <Link href={`${definition.basePath}/${record.id}`} className={buttonClass.secondary}>
              <Eye aria-hidden className="h-4 w-4" /> View details
            </Link>
          ) : undefined
        }
      />
      <ResourceForm
        key={record.id}
        schema={definition.form}
        initial={record}
        target={{ kind: 'resource', resourceKey: definition.key, id: record.id, basePath: definition.basePath }}
        canEdit={canEdit}
        canPublish={can(session, `${definition.permission}.publish` as Permission)}
        optionSets={optionSets}
        media={media}
        previewHref={preview}
        publicUrl={serpBase(definition.key)}
        updatedLabel={updatedLabel(record)}
        aside={
          definition.key === 'staff' && canEdit ? (
            <StaffActions id={record.id} status={String(record.status)} self={record.id === session.user.id} />
          ) : undefined
        }
      />
    </PageReveal>
  );
}
