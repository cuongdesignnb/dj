import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Every admin screen is private: never indexed, never followed.
export const metadata: Metadata = {
  title: { default: 'Admin — Connection Rave', template: '%s — Admin — Connection Rave' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-1 flex-col bg-admin-bg">{children}</div>;
}
