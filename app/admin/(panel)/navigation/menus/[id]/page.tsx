import MenuEditor from '@/components/admin/cms/MenuEditor';
export default async function MenuPage({ params }: { params: Promise<{ id: string }> }) { return <MenuEditor menuId={(await params).id} />; }
