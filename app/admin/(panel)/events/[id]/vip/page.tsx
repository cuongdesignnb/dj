import EventSettingsEditor from '@/components/admin/cms/EventSettingsEditor';
export default async function VipSettingsPage({ params }: { params: Promise<{ id: string }> }) { return <EventSettingsEditor eventId={(await params).id} mode="vip" />; }
