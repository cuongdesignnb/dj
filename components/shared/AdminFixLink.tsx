'use client';

import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';

let sessionCheck: Promise<boolean> | null = null;

/**
 * Whether the current browser is signed in to Admin. Visitors without the admin
 * CSRF cookie never trigger a request; the answer is shared across the page.
 */
function isAdminSignedIn(): Promise<boolean> {
  if (typeof document === 'undefined' || !/(?:^|;\s*)destiny_csrf=/.test(document.cookie)) return Promise.resolve(false);
  sessionCheck ??= fetch('/api/v1/auth/session', { headers: { accept: 'application/json' }, cache: 'no-store' })
    .then(async (response) => response.ok && Boolean((await response.json())?.data?.user))
    .catch(() => false);
  return sessionCheck;
}

/**
 * Shown next to an empty or unavailable public section, only to signed-in admins,
 * linking straight to the Admin screen that fills it.
 */
export default function AdminFixLink({ href, label = 'Fix this in Admin', className = '' }: { href: string; label?: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void isAdminSignedIn().then((signedIn) => { if (!cancelled) setVisible(signedIn); });
    return () => { cancelled = true; };
  }, []);
  if (!visible) return null;
  return (
    <div data-admin-fix-link="" className={`mt-5 flex flex-wrap items-center justify-center gap-3 ${className}`}>
      <a href={href} className="inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border border-amber-300/50 bg-amber-300/10 px-4 text-sm font-semibold text-amber-200 hover:bg-amber-300/20">
        <Wrench aria-hidden className="h-4 w-4" /> {label}
      </a>
      <span className="text-xs text-rave-muted">Only visible to you because you are signed in to Admin.</span>
    </div>
  );
}
