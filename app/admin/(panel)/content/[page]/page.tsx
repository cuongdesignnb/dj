import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SingletonScreen from '@/components/admin/modules/SingletonScreen';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { SINGLETONS } from '@/lib/admin/registry';
import CmsEditor from '@/components/admin/cms/CmsEditor';
import { gate, loadMediaChoices } from '@/lib/admin/page-data';
import type { Permission } from '@/lib/admin/auth/permissions';

type Props = { params: Promise<{ page: string }> };

const PAGES: Record<string, SingletonKey> = {
  home: 'content-home',
  about: 'content-about',
  contact: 'content-contact',
};

const CMS_PAGES: Record<string, string> = {
  events: 'events-list',
  'past-events': 'past-events',
  lineup: 'lineup-list',
  news: 'news-list',
  gallery: 'gallery-list',
  shop: 'shop-list',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = (await params).page;
  const key = PAGES[page];
  return { title: key ? SINGLETONS[key].label : CMS_PAGES[page] ? `${page} page content` : 'Not found' };
}

export default async function ContentPage({ params }: Props) {
  const page = (await params).page;
  const key = PAGES[page];
  if (CMS_PAGES[page]) {
    const { allowed } = await gate('content.view' as Permission);
    if (!allowed) return <CmsEditor contentKey={CMS_PAGES[page]} title={`${page.replace('-', ' ')} page content`} description="Route-specific content is stored in the Page Content CMS." media={[]} />;
    const media = await loadMediaChoices();
    return <CmsEditor contentKey={CMS_PAGES[page]} title={`${page.replace('-', ' ')} page content`} description="Route-specific content is stored in the Page Content CMS." media={media} />;
  }
  if (!key) notFound();
  return <SingletonScreen settingKey={key} />;
}
