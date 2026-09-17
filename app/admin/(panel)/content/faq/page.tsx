import type { Metadata } from 'next';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import FaqManager from '@/components/admin/modules/FaqManager';
import type { FaqItem } from '@/components/admin/modules/FaqManager';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import { gate } from '@/lib/admin/page-data';
import type { SearchParams } from '@/lib/admin/page-data';
import { getRepository } from '@/lib/admin/registry';
import { FAQ_CATEGORY_OPTIONS } from '@/lib/admin/support/definitions';

export const metadata: Metadata = { title: 'FAQ' };

export default async function FaqAdminPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { session, allowed } = await gate('content.view');
  if (!allowed) return <AccessDenied />;

  const requested = (await searchParams).category;
  const category = typeof requested === 'string' && FAQ_CATEGORY_OPTIONS.some((c) => c.value === requested) ? requested : FAQ_CATEGORY_OPTIONS[0]?.value ?? '';
  const result = await (await getRepository('faq')).list({ page: 1, pageSize: 500 });

  const header = (
    <AdminPageHeader
      eyebrow="Content"
      title="FAQ"
      description="Questions and answers shown on the public FAQ page."
      trail={[{ label: 'Dashboard', href: '/admin' }, { label: 'Content' }, { label: 'FAQ' }]}
    />
  );

  if (!result.ok) {
    return (
      <>
        {header}
        <ErrorState title="Could not load questions" message={result.error.message} />
      </>
    );
  }

  const items: FaqItem[] = result.data.items.map((r) => ({
    id: r.id,
    category: String(r.category ?? ''),
    question: (r.question ?? {}) as FaqItem['question'],
    answer: (r.answer ?? {}) as FaqItem['answer'],
    keywords: Array.isArray(r.keywords) ? r.keywords.map(String) : [],
    published: r.published === true,
    answersConfirmed: r.answersConfirmed === true,
    sortOrder: Number(r.sortOrder ?? 0),
  }));

  return (
    <PageReveal>
      {header}
      <FaqManager
        items={items}
        categories={FAQ_CATEGORY_OPTIONS}
        active={category}
        canCreate={can(session, 'content.create')}
        canEdit={can(session, 'content.edit')}
        canDelete={can(session, 'content.delete')}
      />
    </PageReveal>
  );
}
