import CmsEditor from '@/components/admin/cms/CmsEditor';
import { loadMediaChoices } from '@/lib/admin/page-data';
export default async function EventPageContentPage({ params }: { params: Promise<{ id: string }> }) { const id = (await params).id; return <CmsEditor contentKey={`event:${id}`} title="Event Page Content" description="Highlights, What to Expect, Good to Know, venue photo and directions, organiser and the closing call-to-action on the public event page." media={await loadMediaChoices()} />; }
