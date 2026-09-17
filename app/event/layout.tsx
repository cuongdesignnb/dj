import type { Metadata } from 'next';

// Scope the layout to /event. No data fetching here, per spec.

export const metadata: Metadata = {
  title: 'Event Details | Connection Rave',
  description: 'Published event details, music, lineup and venue information from Connection Rave.',
};

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
