import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ResourceForm from '@/components/admin/form/ResourceForm';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import type { Permission } from '@/lib/admin/auth/permissions';
import type { ResourceKey } from '@/lib/admin/common/resource';
import { gate, loadMediaChoices, loadOptionSets, optionSourcesOf, serpBase } from '@/lib/admin/page-data';
import { ROUTED_RESOURCES, getResource } from '@/lib/admin/registry';

type Props = { params: Promise<{ resource: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const definition = getResource((await params).resource);
  return { title: definition ? `New ${definition.singular.toLowerCase()}` : 'Not found' };
}

export default async function ResourceCreatePage({ params }: Props) {
  const { resource } = await params;
  const definition = getResource(resource);
  if (!definition || !definition.form || !ROUTED_RESOURCES.includes(resource as ResourceKey)) notFound();

  const { session, allowed } = await gate(`${definition.permission}.create` as Permission);
  if (!allowed) return <AccessDenied />;

  const [optionSets, media] = await Promise.all([loadOptionSets(optionSourcesOf(definition)), loadMediaChoices()]);
  const title = definition.key === 'staff' ? 'Invite Staff' : `Add ${definition.singular}`;

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow={definition.group}
        title={title}
        trail={[
          { label: 'Dashboard', href: '/admin' },
          { label: definition.label, href: definition.basePath },
          { label: title },
        ]}
        description={
          definition.key === 'staff'
            ? 'Adds the person to the team list. The invitation email is sent by the backend once it is connected.'
            : undefined
        }
      />
      <ResourceForm
        schema={definition.form}
        initial={{ ...(definition.newRecord?.() ?? {}) }}
        target={{ kind: 'resource', resourceKey: definition.key, id: null, basePath: definition.basePath }}
        canEdit
        canPublish={can(session, `${definition.permission}.publish` as Permission)}
        optionSets={optionSets}
        media={media}
        publicUrl={serpBase(definition.key)}
      />
    </PageReveal>
  );
}
