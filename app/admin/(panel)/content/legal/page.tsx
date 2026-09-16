import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, FileText, Pencil } from 'lucide-react';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import { buttonClass } from '@/components/admin/ui/buttonClass';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { formatDate } from '@/lib/admin/common/table';
import { gate } from '@/lib/admin/page-data';
import { getRepository } from '@/lib/admin/registry';

export const metadata: Metadata = { title: 'Legal Documents' };

export default async function LegalListPage() {
  const { allowed } = await gate('content.view');
  if (!allowed) return <AccessDenied />;

  const result = await (await getRepository('legal')).list({ page: 1, pageSize: 10 });

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow="Content"
        title="Legal Documents"
        description="Terms & Conditions and Privacy Policy. The wording must come from the organizer or legal counsel."
        trail={[{ label: 'Dashboard', href: '/admin' }, { label: 'Content' }, { label: 'Legal Documents' }]}
      />
      {!result.ok ? (
        <ErrorState title="Could not load legal documents" message={result.error.message} />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {result.data.items.map((doc) => {
            const sections = Array.isArray(doc.sections) ? doc.sections.length : 0;
            return (
              <li key={doc.id} className="flex flex-col rounded-[12px] border border-admin-border bg-admin-panel/90 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-rave-red/10 text-rave-red">
                      <FileText aria-hidden className="h-5 w-5" />
                    </span>
                    <h2 className="font-heading text-lg font-semibold uppercase tracking-wide text-white">{String(doc.title)}</h2>
                  </span>
                  <StatusBadge value={String(doc.status)} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-admin-muted">Version</dt>
                    <dd className="text-white">{String(doc.version || 'Not assigned')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-admin-muted">Effective date</dt>
                    <dd className="text-white">{doc.effectiveDate ? formatDate(doc.effectiveDate) : 'Not set'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-admin-muted">Sections</dt>
                    <dd className="text-white">{sections}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-admin-muted">Updated</dt>
                    <dd className="text-white">{formatDate(doc.updatedAt, true)}</dd>
                  </div>
                </dl>
                {doc.status !== 'published' && (
                  <p className="mt-4 text-xs text-admin-warning">Draft wording. It needs legal review before it is published.</p>
                )}
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/admin/content/legal/${doc.id}`} className={buttonClass.primary}>
                    <Pencil aria-hidden className="h-4 w-4" /> Edit
                  </Link>
                  <a href={`/${doc.id}`} target="_blank" rel="noopener noreferrer" className={buttonClass.secondary}>
                    <ExternalLink aria-hidden className="h-4 w-4" /> View page<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageReveal>
  );
}
