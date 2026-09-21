import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SingletonScreen from '@/components/admin/modules/SingletonScreen';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { SINGLETONS } from '@/lib/admin/registry';
import CmsEditor from '@/components/admin/cms/CmsEditor';
import { loadMediaChoices } from '@/lib/admin/page-data';

type Props = { params: Promise<{ section: string }> };

const SECTIONS: Record<string, SingletonKey> = {
  site: 'settings-site',
  social: 'settings-social',
  languages: 'settings-languages',
  integrations: 'settings-integrations',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const section = (await params).section;
  const key = SECTIONS[section];
  return { title: key ? SINGLETONS[key].label : section === 'global-content' ? 'Global Content' : 'Not found' };
}

export default async function SettingsPage({ params }: Props) {
  const section = (await params).section;
  if (section === 'global-content') return <CmsEditor contentKey="global-content" title="Global Content" description="Only truly global copy belongs here; page-specific content stays with its page." media={await loadMediaChoices()} />;
  const key = SECTIONS[section];
  if (!key) notFound();
  return <SingletonScreen settingKey={key} />;
}
