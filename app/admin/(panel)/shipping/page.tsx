import type { Metadata } from 'next';
import SingletonScreen from '@/components/admin/modules/SingletonScreen';

export const metadata: Metadata = { title: 'Shipping Settings' };

export default function ShippingPage() {
  return <SingletonScreen settingKey="shipping" />;
}
