import EventResourceEditor from '@/components/admin/cms/EventResourceEditor';
export default async function VipBoothsPage({ params }: { params: Promise<{ id: string }> }) { return <EventResourceEditor eventId={(await params).id} resource="booths" />; }
