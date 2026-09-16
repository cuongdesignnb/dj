import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SingletonScreen from '@/components/admin/modules/SingletonScreen';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { SINGLETONS } from '@/lib/admin/registry';

type Props = { params: Promise<{ section: string }> };

const SECTIONS: Record<string, SingletonKey> = {
  site: 'settings-site',
  social: 'settings-social',
  languages: 'settings-languages',
  integrations: 'settings-integrations',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = SECTIONS[(await params).section];
  return { title: key ? SINGLETONS[key].label : 'Not found' };
}

export default async function SettingsPage({ params }: Props) {
  const key = SECTIONS[(await params).section];
  if (!key) notFound();
  return <SingletonScreen settingKey={key} />;
}
