import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ResourceForm from '@/components/admin/form/ResourceForm';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import { gate, updatedLabel } from '@/lib/admin/page-data';
import { RESOURCES, getRepository } from '@/lib/admin/registry';

type Props = { params: Promise<{ doc: string }> };

const DOCS = ['terms', 'privacy'];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { doc } = await params;
  return { title: doc === 'terms' ? 'Terms & Conditions' : doc === 'privacy' ? 'Privacy Policy' : 'Not found' };
}

export default async function LegalEditPage({ params }: Props) {
  const { doc } = await params;
  if (!DOCS.includes(doc)) notFound();

  const { session, allowed } = await gate('content.view');
  if (!allowed) return <AccessDenied />;

  const definition = RESOURCES.legal;
  const result = await (await getRepository('legal')).get(doc);
  if (!result.ok) return <ErrorState title="Could not load this document" message={result.error.message} />;
  const record = result.data;
  if (!record || !definition.form) notFound();

  const title = String(record.title);

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow="Legal Document"
        title={title}
        description="This editor stores the wording supplied by the organizer or counsel. It does not write legal terms, and saving does not publish."
        trail={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Legal Documents', href: '/admin/content/legal' },
          { label: title },
        ]}
      />
      <ResourceForm
        schema={definition.form}
        initial={record}
        target={{ kind: 'resource', resourceKey: 'legal', id: record.id, basePath: definition.basePath }}
        canEdit={can(session, 'content.edit')}
        canPublish={can(session, 'content.publish')}
        optionSets={{}}
        media={[]}
        previewHref={`/${record.id}`}
        updatedLabel={updatedLabel(record)}
      />
    </PageReveal>
  );
}
