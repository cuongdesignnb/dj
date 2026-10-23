import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AdminThemePin from '@/components/admin/AdminThemePin';

// Every admin screen is private: never indexed, never followed.
export const metadata: Metadata = {
  title: { absolute: 'Admin — Connection Rave', template: '%s — Admin — Connection Rave' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  // Admin keeps the original palette whatever theme the public site uses.
  return <div data-theme="connection" className="flex min-h-screen flex-1 flex-col bg-admin-bg"><AdminThemePin />{children}</div>;
}
