import CmsEditor from '@/components/admin/cms/CmsEditor';
export default async function TicketContentPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; return <CmsEditor contentKey={`tickets:${id}`} title="Ticket Page Content" description="Hero, selector copy, trust items, information cards, FAQ, CTA and SEO for /tickets." />; }
