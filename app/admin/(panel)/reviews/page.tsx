import type { Metadata } from 'next';
import AdminPageHeader from '@/components/admin/layout/AdminPageHeader';
import ReviewsModeration from '@/components/admin/modules/ReviewsModeration';
import { PageReveal } from '@/components/admin/ui/Reveal';
import { AccessDenied } from '@/components/admin/ui/States';
import { can } from '@/lib/admin/auth/session';
import { gate } from '@/lib/admin/page-data';
import { listAdminReviews } from '@/server/services/reviews';

export const metadata: Metadata = { title: 'Reviews' };
export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const { session, allowed } = await gate('content.view');
  if (!allowed) return <AccessDenied />;
  const reviews = await listAdminReviews();
  return (
    <PageReveal>
      <AdminPageHeader
        eyebrow="Content"
        title="Reviews"
        description="Visitors write reviews on the event pages. Nothing appears on the website until you approve it. Hidden reviews stay stored but out of view."
        trail={[{ label: 'Dashboard', href: '/admin' }, { label: 'Reviews' }]}
      />
      <ReviewsModeration initial={reviews} canEdit={can(session, 'content.edit')} />
    </PageReveal>
  );
}
