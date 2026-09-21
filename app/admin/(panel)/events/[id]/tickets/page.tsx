import EventSettingsEditor from '@/components/admin/cms/EventSettingsEditor';
export default async function TicketSettingsPage({ params }: { params: Promise<{ id: string }> }) { return <EventSettingsEditor eventId={(await params).id} mode="tickets" />; }
