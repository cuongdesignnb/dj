import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import LoginForm from '@/components/admin/auth/LoginForm';
import { getAdminSession } from '@/lib/admin/auth/session';
import { getEnvironmentBadge } from '@/lib/admin/common/config';

export const metadata: Metadata = { title: 'Sign in' };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect('/admin');
  const env = getEnvironmentBadge();

  return (
    <main className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,23,61,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(123,63,255,0.12),transparent_50%)]"
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/assets/logo-connection.svg" alt="Connection" width={160} height={43} className="h-11 w-auto" priority />
          <p className="mt-3 font-heading text-[11px] uppercase tracking-[0.45em] text-admin-muted">Admin Dashboard</p>
        </div>
        <section aria-labelledby="login-title" className="rounded-[14px] border border-admin-border bg-admin-panel/95 p-6 shadow-2xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h1 id="login-title" className="font-heading text-2xl font-bold uppercase tracking-[0.06em] text-white">
                Sign in
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-admin-muted">
                <ShieldCheck aria-hidden className="h-4 w-4 text-rave-red" /> Authorized access only
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-admin-muted">{env.label}</span>
          </div>
          <LoginForm />
        </section>
        <p className="mt-6 text-center text-xs text-admin-muted">
          <Link href="/" className="hover:text-white focus:outline-none focus-visible:underline">
            Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
