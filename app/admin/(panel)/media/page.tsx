import type { Metadata } from 'next';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import MediaLibrary from '@/components/admin/modules/MediaLibrary';
import type { MediaItem } from '@/components/admin/modules/MediaLibrary';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import { parseListParams } from '@/lib/admin/common/pagination';
import { formatDate } from '@/lib/admin/common/table';
import { gate } from '@/lib/admin/page-data';
import type { SearchParams } from '@/lib/admin/page-data';
import { RESOURCES, getRepository } from '@/lib/admin/registry';

export const metadata: Metadata = { title: 'Media Library' };

export default async function MediaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { session, allowed } = await gate('media.view');
  if (!allowed) return <AccessDenied />;

  const definition = RESOURCES.media;
  const raw = await searchParams;
  const filterKeys = definition.filters.map((f) => f.key);
  const params = parseListParams({ pageSize: '20', ...raw }, filterKeys);
  const result = await (await getRepository('media')).list(params);

  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const v = Array.isArray(value) ? value[0] : value;
    if (v && ['search', 'page', 'view', ...filterKeys].includes(key)) query[key] = v;
  }

  const items: MediaItem[] = result.ok
    ? result.data.items.map((r) => ({
        id: r.id,
        name: String(r.name ?? ''),
        url: String(r.url ?? ''),
        kind: String(r.kind ?? 'image'),
        alt: String(r.alt ?? ''),
        mimeType: String(r.mimeType ?? ''),
        usedBy: Array.isArray(r.usedBy) ? r.usedBy.map(String) : [],
        updated: formatDate(r.updatedAt, true),
      }))
    : [];

  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow="Content"
        title="Media Library"
        description={definition.description}
        trail={[{ label: 'Dashboard', href: '/admin' }, { label: 'Content' }, { label: 'Media Library' }]}
      />
      <MediaLibrary
        items={items}
        total={result.ok ? result.data.total : 0}
        page={result.ok ? result.data.page : 1}
        pageSize={params.pageSize}
        query={query}
        filters={definition.filters}
        error={result.ok ? null : result.error.message}
        canEdit={can(session, 'media.edit')}
        canDelete={can(session, 'media.delete')}
      />
    </PageReveal>
  );
}
