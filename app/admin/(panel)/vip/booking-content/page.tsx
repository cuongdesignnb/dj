import EventModuleLanding from '@/components/admin/cms/EventModuleLanding';
import { getRepository } from '@/lib/admin/registry';
export default async function VipBookingContentPage() { const result = await (await getRepository('events')).list({ page: 1, pageSize: 100 }); return <EventModuleLanding events={result.ok ? result.data.items : []} module="vip" />; }
