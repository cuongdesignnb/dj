'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronDown,
  Handshake,
  LayoutDashboard,
  Mic2,
  Newspaper,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Network,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { hasPermission } from '@/lib/admin/auth/permissions';
import { adminSidebarGroup } from '@/lib/animations';
import { ADMIN_NAV, activeNavHref } from '@/lib/admin/nav';
import type { NavIcon } from '@/lib/admin/nav';
import { useAdminSession } from '../ui/PermissionGate';

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  events: CalendarDays,
  artists: Mic2,
  merch: ShoppingCart,
  content: Newspaper,
  partners: Handshake,
  team: ShieldCheck,
  settings: Settings,
  navigation: Network,
};

function Brand({ compact }: { compact: boolean }) {
  return (
    <Link href="/admin" className="block rounded-[8px] px-2 py-1 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red">
      {compact ? (
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-full border-2 border-rave-red font-heading text-lg font-bold text-white">C</span>
      ) : (
        <>
          <span className="block font-heading text-xl font-black italic uppercase tracking-wide text-rave-red">Connection Rave</span>
          <span className="block font-heading text-sm uppercase tracking-[0.45em] text-white">Destiny</span>
          <span className="mt-2 block text-[10px] uppercase tracking-[0.5em] text-admin-muted">Admin Panel</span>
        </>
      )}
    </Link>
  );
}

/**
 * Sidebar navigation. Full width on desktop, an icon rail on tablets (with a
 * toggle to expand), and a drawer on phones. Groups open to the active page.
 */
export default function AdminSidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  variant,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  variant: 'fixed' | 'drawer';
}) {
  const pathname = usePathname() ?? '/admin';
  const session = useAdminSession();
  const active = activeNavHref(pathname);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const granted = session?.permissions ?? [];
    const needle = query.trim().toLowerCase();
    return ADMIN_NAV.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          hasPermission(granted, item.permission) &&
          (!needle || item.label.toLowerCase().includes(needle) || group.label.toLowerCase().includes(needle)),
      ),
    })).filter((group) => group.items.length > 0);
  }, [session, query]);

  const activeGroup = groups.find((g) => g.items.some((i) => i.href === active))?.id;
  // Explicit open/closed choices; untouched groups follow the active page.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const isOpen = (id: string) => query.trim().length > 0 || (overrides[id] ?? id === activeGroup);
  const toggle = (id: string) => setOverrides((current) => ({ ...current, [id]: !isOpen(id) }));

  const compact = collapsed && variant === 'fixed';

  return (
    <nav
      aria-label="Admin"
      className={`flex h-full flex-col border-r border-admin-border bg-admin-deep ${compact ? 'w-[76px]' : 'w-[272px]'}`}
    >
      <div className="px-3 pb-3 pt-5">
        <Brand compact={compact} />
      </div>

      {!compact && (
        <div className="px-4 pb-3">
          <label className="relative block">
            <span className="sr-only">Search menu</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu..."
              className="min-h-[40px] w-full rounded-[8px] border border-admin-border bg-admin-panel pl-9 pr-3 text-sm text-white placeholder:text-admin-muted focus:border-rave-red focus:outline-none"
            />
          </label>
        </div>
      )}

      <ul className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {groups.map((group) => {
          const Icon = ICONS[group.icon];
          const single = group.items.length === 1 && group.items[0].label === group.label;
          const groupActive = group.id === activeGroup;

          if (compact) {
            const target = group.items[0];
            return (
              <li key={group.id}>
                <Link
                  href={target.href}
                  onClick={onNavigate}
                  title={group.label}
                  aria-label={group.label}
                  aria-current={groupActive ? 'page' : undefined}
                  className={`mx-auto grid h-11 w-11 place-items-center rounded-[10px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                    groupActive ? 'bg-rave-red/20 text-rave-red' : 'text-admin-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon aria-hidden className="h-5 w-5" />
                </Link>
              </li>
            );
          }

          if (single) {
            const item = group.items[0];
            const current = item.href === active;
            return (
              <li key={group.id}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={current ? 'page' : undefined}
                  className={`flex min-h-[44px] items-center gap-3 rounded-[10px] border px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                    current
                      ? 'border-rave-red/70 bg-rave-red/15 text-white shadow-[0_0_18px_rgba(255,23,61,0.18)]'
                      : 'border-transparent text-white/85 hover:bg-white/5'
                  }`}
                >
                  <Icon aria-hidden className={`h-5 w-5 ${current ? 'text-rave-red' : 'text-admin-muted'}`} />
                  {group.label}
                </Link>
              </li>
            );
          }

          const expanded = isOpen(group.id);
          const panelId = `nav-${group.id}`;
          return (
            <li key={group.id}>
              <button
                type="button"
                onClick={() => toggle(group.id)}
                aria-expanded={expanded}
                aria-controls={expanded ? panelId : undefined}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-semibold transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                  groupActive ? 'text-rave-red' : 'text-white/90'
                }`}
              >
                <Icon aria-hidden className={`h-5 w-5 ${groupActive ? 'text-rave-red' : 'text-admin-muted'}`} />
                <span className="flex-1">{group.label}</span>
                <ChevronDown
                  aria-hidden
                  className={`h-4 w-4 text-admin-muted transition-transform duration-200 motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {expanded && (
                  <motion.ul
                    id={panelId}
                    variants={adminSidebarGroup}
                    initial="closed"
                    animate="open"
                    exit="closed"
                    className="overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const current = item.href === active;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={onNavigate}
                            aria-current={current ? 'page' : undefined}
                            className={`relative ml-5 flex min-h-[36px] items-center gap-3 rounded-[8px] pl-5 pr-3 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                              current ? 'bg-rave-red/10 font-semibold text-white' : 'text-admin-muted hover:text-white'
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`absolute left-1.5 h-1.5 w-1.5 rounded-full ${current ? 'bg-rave-red shadow-[0_0_8px_rgba(255,23,61,0.8)]' : 'bg-white/25'}`}
                            />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          );
        })}
        {groups.length === 0 && <li className="px-3 py-2 text-sm text-admin-muted">No menu items match.</li>}
      </ul>

      {variant === 'fixed' && onToggleCollapsed && (
        <div className="border-t border-admin-border p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand menu"
            className="mx-auto grid h-10 w-10 place-items-center rounded-[8px] text-admin-muted hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
          >
            <PanelLeftOpen aria-hidden className="h-5 w-5" />
          </button>
        </div>
      )}
    </nav>
  );
}
