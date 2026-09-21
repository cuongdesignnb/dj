import CmsEditor from '@/components/admin/cms/CmsEditor';
export default async function TablesContentPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; return <CmsEditor contentKey={`tables:${id}`} title="Tables Page Content" description="Hero, club map, VIP information, FAQ, CTA and SEO for /tables." />; }
