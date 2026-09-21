import CmsEditor from '@/components/admin/cms/CmsEditor';
export default async function BookingContentPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; return <CmsEditor contentKey={`booking:${id}`} title="Booking Page Content" description="Hero, tabs, form labels, notes, process, FAQ, CTA and SEO for /book-now." />; }
