import type { Metadata } from 'next';

// Scope the layout to /event. No data fetching here, per spec.

export const metadata: Metadata = {
  title: 'DESTINY — Event Details',
  description:
    'The Destiny event details — music, lineup, venue and tickets for Connection Rave.',
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
