'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import type { EnvironmentBadge } from '@/lib/admin/common/config';
import { adminDrawer } from '@/lib/animations';
import { AdminSessionProvider } from '../ui/PermissionGate';
import type { ClientSession } from '../ui/PermissionGate';
import { ToastProvider } from '../ui/Toast';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import type { TopbarNotification } from './AdminTopbar';

/** Sidebar + topbar + main area for every signed-in admin page. */
export default function AdminShell({
  session,
  environment,
  notifications,
  children,
}: {
  session: ClientSession;
  environment: EnvironmentBadge;
  notifications: TopbarNotification[];
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  // Drawer: the menu on phones, and the expanded menu over the tablet rail.
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close the drawer whenever the route changes (derived during render).
  if (navPath !== pathname) {
    setNavPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button, input') ?? []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
      if (e.key !== 'Tab') return;
      // Keep focus inside the drawer while it is open.
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [mobileOpen]);

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'user'}>
      <AdminSessionProvider session={session}>
        <ToastProvider>
          <a
            href="#admin-main"
            className="sr-only z-[90] rounded bg-rave-red px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
          >
            Skip to content
          </a>
          <div className="min-h-screen bg-admin-bg font-body text-white">
            {/* Desktop: full sidebar. Tablet: icon rail that expands into the drawer. */}
            <div className="fixed inset-y-0 left-0 z-40 hidden w-[272px] xl:block">
              <AdminSidebar variant="fixed" collapsed={false} />
            </div>
            <div className="fixed inset-y-0 left-0 z-40 hidden w-[76px] md:block xl:hidden">
              <AdminSidebar variant="fixed" collapsed onToggleCollapsed={() => setMobileOpen(true)} />
            </div>

            {/* Phones and tablets: drawer. */}
            <AnimatePresence>
              {mobileOpen && (
                <div ref={drawerRef} className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70"
                    onClick={() => setMobileOpen(false)}
                  />
                  <motion.div
                    variants={adminDrawer}
                    initial={{ x: '-100%' }}
                    animate="visible"
                    exit={{ x: '-100%' }}
                    className="relative h-full w-[272px]"
                  >
                    <AdminSidebar variant="drawer" collapsed={false} onNavigate={() => setMobileOpen(false)} />
                    <button
                      type="button"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Close menu"
                      className="absolute -right-12 top-4 grid h-10 w-10 place-items-center rounded-full bg-admin-panel text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                    >
                      <X aria-hidden className="h-5 w-5" />
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <div className="md:pl-[76px] xl:pl-[272px]">
              <AdminTopbar environment={environment} notifications={notifications} onOpenMenu={() => setMobileOpen(true)} />
              <main id="admin-main" tabIndex={-1} className="px-4 py-5 focus:outline-none sm:px-6 lg:px-8 lg:py-7">
                {children}
              </main>
            </div>
          </div>
        </ToastProvider>
      </AdminSessionProvider>
    </MotionConfig>
  );
}
