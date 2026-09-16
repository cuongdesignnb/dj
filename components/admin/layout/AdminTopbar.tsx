'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, ChevronDown, ExternalLink, LogOut, Menu, Search, Settings, UserRound } from 'lucide-react';
import { adminSearch, signOut } from '@/app/admin/actions';
import type { SearchHit } from '@/app/admin/actions';
import type { EnvironmentBadge } from '@/lib/admin/common/config';
import { useAdminSession } from '../ui/PermissionGate';

export interface TopbarNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
}

const BADGE_TONE: Record<EnvironmentBadge['tone'], string> = {
  demo: 'border-admin-warning/40 text-admin-warning',
  production: 'border-admin-success/40 text-admin-success',
  preview: 'border-rave-blue/40 text-[#7FA6FF]',
  local: 'border-white/20 text-admin-muted',
};

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close, ref]);
}

function GlobalSearch() {
  const router = useRouter();
  const listId = useId();
  const box = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  useDismiss(open, () => setOpen(false), box);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => {
      start(async () => {
        const result = await adminSearch(q);
        setHits(result.ok ? result.data : []);
        setOpen(true);
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const shown = query.trim().length >= 2 ? hits : [];
  const grouped = shown.reduce<Record<string, SearchHit[]>>((acc, hit) => {
    (acc[hit.module] ??= []).push(hit);
    return acc;
  }, {});

  return (
    <div ref={box} className="relative w-full max-w-[320px]">
      <label className="relative block">
        <span className="sr-only">Search the admin</span>
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
        <input
          type="search"
          role="combobox"
          aria-expanded={open && query.trim().length >= 2}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && shown[0]) {
              router.push(shown[0].href);
              setOpen(false);
            }
          }}
          placeholder="Search anything..."
          className="min-h-[40px] w-full rounded-[8px] border border-admin-border bg-admin-panel pl-9 pr-3 text-sm text-white placeholder:text-admin-muted focus:border-rave-red focus:outline-none"
        />
      </label>
      {open && query.trim().length >= 2 && (
        <div
          id={listId}
          role="listbox"
          aria-label="Search results"
          aria-busy={pending || undefined}
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-[10px] border border-admin-border bg-admin-panel2 p-2 shadow-2xl"
        >
          {pending && shown.length === 0 && <p className="px-3 py-2 text-sm text-admin-muted">Searching…</p>}
          {!pending && shown.length === 0 && <p className="px-3 py-2 text-sm text-admin-muted">No results for “{query.trim()}”.</p>}
          {Object.entries(grouped).map(([module, items]) => (
            <div key={module} role="group" aria-label={module} className="py-1">
              <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-admin-muted">{module}</p>
              {items.map((hit) => (
                <Link
                  key={hit.href + hit.label}
                  href={hit.href}
                  role="option"
                  aria-selected={false}
                  onClick={() => setOpen(false)}
                  className="block rounded-[6px] px-3 py-2 text-sm text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none"
                >
                  {hit.label}
                  {hit.sub && <span className="ml-2 text-xs text-admin-muted">{hit.sub}</span>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications({ items, demo }: { items: TopbarNotification[]; demo: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useDismiss(open, () => setOpen(false), box);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={`Notifications, ${items.length} ${items.length === 1 ? 'item' : 'items'}`}
        className="relative grid h-10 w-10 place-items-center rounded-[8px] text-admin-muted hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
      >
        <Bell aria-hidden className="h-5 w-5" />
        {items.length > 0 && (
          <span aria-hidden className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rave-red px-1 text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(90vw,340px)] rounded-[10px] border border-admin-border bg-admin-panel2 p-2 shadow-2xl">
          <p className="flex items-center justify-between px-3 py-2 text-xs uppercase tracking-[0.2em] text-admin-muted">
            Notifications
            {demo && <span className="normal-case tracking-normal text-admin-warning">Demo</span>}
          </p>
          {items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-admin-muted">Nothing needs your attention.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} onClick={() => setOpen(false)} className="block rounded-[6px] px-3 py-2 hover:bg-white/5 focus:bg-white/5 focus:outline-none">
                    <span className="block text-sm text-white">{item.title}</span>
                    <span className="block text-xs text-admin-muted">{item.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const session = useAdminSession();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();
  useDismiss(open, () => setOpen(false), box);
  if (!session) return null;
  const initials = session.name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const item = 'flex w-full min-h-[40px] items-center gap-2 rounded-[6px] px-3 text-left text-sm text-white hover:bg-white/5 focus:bg-white/5 focus:outline-none';

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-haspopup="menu"
        className="flex min-h-[44px] items-center gap-3 rounded-[10px] px-2 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
      >
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full border border-rave-red/60 bg-rave-red/15 text-sm font-semibold text-white">
          {initials}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold text-white">{session.name}</span>
          <span className="block text-xs text-admin-muted">{session.roleName}</span>
        </span>
        <ChevronDown aria-hidden className="hidden h-4 w-4 text-admin-muted sm:block" />
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-[10px] border border-admin-border bg-admin-panel2 p-2 shadow-2xl">
          <Link role="menuitem" href={`/admin/staff/${session.userId}/edit`} className={item} onClick={() => setOpen(false)}>
            <UserRound aria-hidden className="h-4 w-4 text-admin-muted" /> Profile
          </Link>
          <Link role="menuitem" href="/admin/settings/site" className={item} onClick={() => setOpen(false)}>
            <Settings aria-hidden className="h-4 w-4 text-admin-muted" /> Account Settings
          </Link>
          <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className={item}>
            <ExternalLink aria-hidden className="h-4 w-4 text-admin-muted" /> View Website
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <form action={signOut}>
            <button role="menuitem" type="submit" className={`${item} text-[#FF6B82]`}>
              <LogOut aria-hidden className="h-4 w-4" /> Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function AdminTopbar({
  environment,
  notifications,
  onOpenMenu,
}: {
  environment: EnvironmentBadge;
  notifications: TopbarNotification[];
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-admin-border bg-admin-bg/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="grid h-10 w-10 place-items-center rounded-[8px] text-white hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red md:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <span
          className={`hidden items-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-medium lg:inline-flex ${BADGE_TONE[environment.tone]}`}
          title={environment.tone === 'demo' ? 'Showing demo data. Changes are not persisted.' : undefined}
        >
          <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
          <span className="sr-only">Environment: </span>
          {environment.label}
        </span>
        <div className="hidden flex-1 justify-end sm:flex">
          <GlobalSearch />
        </div>
        <Notifications items={notifications} demo={environment.tone === 'demo'} />
        <UserMenu />
      </div>
    </header>
  );
}
