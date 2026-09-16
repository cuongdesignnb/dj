import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import SingletonScreen from '@/components/admin/modules/SingletonScreen';
import type { SingletonKey } from '@/lib/admin/common/resource';
import { SINGLETONS } from '@/lib/admin/registry';

type Props = { params: Promise<{ page: string }> };

const PAGES: Record<string, SingletonKey> = {
  home: 'content-home',
  about: 'content-about',
  contact: 'content-contact',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const key = PAGES[(await params).page];
  return { title: key ? SINGLETONS[key].label : 'Not found' };
}

export default async function ContentPage({ params }: Props) {
  const key = PAGES[(await params).page];
  if (!key) notFound();
  return <SingletonScreen settingKey={key} />;
}
