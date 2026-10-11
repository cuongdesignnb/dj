import type { Metadata } from 'next';
import { siteTitle } from '@/lib/seo/config';

// Scope the layout to /event. No data fetching here, per spec.

export const metadata: Metadata = {
  title: siteTitle('Event Details'),
  description: 'Published event details, music, lineup and venue information from Connection Rave.',
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
