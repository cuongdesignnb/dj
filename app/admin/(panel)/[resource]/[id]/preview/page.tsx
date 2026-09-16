import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';
import ArticleBody from '@/components/news/ArticleBody';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import { buttonClass } from '@/components/admin/ui/buttonClass';
import { AccessDenied, ErrorState } from '@/components/admin/ui/States';
import StatusBadge from '@/components/admin/ui/StatusBadge';
import { formatDate, textOf } from '@/lib/admin/common/table';
import { gate } from '@/lib/admin/page-data';
import { getRepository } from '@/lib/admin/registry';
import { CATEGORY_LABELS } from '@/lib/news/helpers';
import type { ArticleContentBlock } from '@/lib/news/types';

type Props = { params: Promise<{ resource: string; id: string }> };

export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

/** Draft preview for articles. Admin-only, never indexed, clearly labelled. */
export default async function ArticlePreviewPage({ params }: Props) {
  const { resource, id } = await params;
  if (resource !== 'news') notFound();

  const { allowed } = await gate('news.view');
  if (!allowed) return <AccessDenied />;

  const result = await (await getRepository('news')).get(decodeURIComponent(id));
  if (!result.ok) return <ErrorState title="Could not load this article" message={result.error.message} />;
  const article = result.data;
  if (!article) notFound();

  const title = textOf(article.title);
  const hero = (article.heroImage ?? null) as { src?: string; alt?: string } | null;
  const blocks = (Array.isArray(article.body) ? article.body : []) as ArticleContentBlock[];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Preview"
        title={title}
        trail={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'News', href: '/admin/news' },
          { label: title, href: `/admin/news/${article.id}/edit` },
          { label: 'Preview' },
        ]}
        actions={
          <Link href={`/admin/news/${article.id}/edit`} className={buttonClass.primary}>
            <Pencil aria-hidden className="h-4 w-4" /> Back to editor
          </Link>
        }
      />
      <div role="note" className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] border border-rave-blue/40 bg-rave-blue/[0.08] px-4 py-2.5 text-sm text-white">
        <span className="rounded-full bg-rave-blue px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white">Preview</span>
        Showing the last saved version. Visitors cannot see this page.
        <StatusBadge value={String(article.status)} />
      </div>

      <article className="mx-auto max-w-3xl overflow-hidden rounded-[14px] border border-admin-border bg-rave-black">
        {hero?.src && (
          <div className="relative aspect-[16/9]">
            <Image src={hero.src} alt={hero.alt ?? ''} fill sizes="(min-width: 768px) 768px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="px-5 py-8 sm:px-10">
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-rave-red">{CATEGORY_LABELS[article.category as keyof typeof CATEGORY_LABELS] ?? String(article.category)}</p>
          <h2 className="mt-2 font-heading text-3xl font-bold uppercase text-white sm:text-4xl">{title}</h2>
          <p className="mt-2 text-sm text-rave-muted">
            {article.publishedAt ? `Published ${formatDate(article.publishedAt)}` : 'Not published yet'}
          </p>
          {textOf(article.excerpt) !== '—' && <p className="mt-5 text-lg text-white/85">{textOf(article.excerpt)}</p>}
          <div className="mt-8">
            {blocks.length ? <ArticleBody blocks={blocks} /> : <p className="text-sm text-admin-muted">This article has no body yet.</p>}
          </div>
        </div>
      </article>
    </div>
  );
}
