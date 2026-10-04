'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useId, useSyncExternalStore, type ComponentProps } from 'react';

// One indicator for the app, including a mobile link that unmounts when its drawer closes.
const listeners = new Set<() => void>();
const loaders = new Set<string>();
let intent = false;
let expired = false;
let deadline: ReturnType<typeof setTimeout> | undefined;
const notify = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => !expired && (intent || loaders.size > 0);
function finishIntent() { intent = false; notify(); }
function beginIntent(href: ComponentProps<typeof Link>['href']) {
  const raw = typeof href === 'string' ? href : href.pathname;
  if (!raw) return;
  const target = new URL(raw, window.location.href);
  if (target.origin !== window.location.origin || (target.pathname === window.location.pathname && target.search === window.location.search)) return;
  intent = true;
  expired = false;
  clearTimeout(deadline);
  // A cancelled/failed transition must not leave a permanent indicator; the page error remains visible.
  deadline = setTimeout(() => { intent = false; expired = true; notify(); }, 30_000);
  notify();
}

export function NavigationLink({ onNavigate, ...props }: ComponentProps<typeof Link>) {
  return <Link {...props} onNavigate={(event) => {
    let cancelled = false;
    onNavigate?.({ preventDefault: () => { cancelled = true; event.preventDefault(); } });
    if (!cancelled) beginIntent(props.href);
  }} />;
}

/** Keep feedback active after the URL commits while a route Suspense fallback is still mounted. */
export function RouteLoadingMarker() {
  const id = useId();
  useEffect(() => {
    loaders.add(id); notify();
    return () => { loaders.delete(id); notify(); };
  }, [id]);
  return null;
}

export default function NavigationFeedback() {
  const pathname = usePathname();
  const search = useSearchParams();
  const pending = useSyncExternalStore(subscribe, snapshot, () => false);
  useEffect(() => { finishIntent(); }, [pathname, search]);
  useEffect(() => {
    const reset = () => { intent = false; expired = false; clearTimeout(deadline); notify(); };
    window.addEventListener('pagehide', reset);
    return () => { window.removeEventListener('pagehide', reset); clearTimeout(deadline); };
  }, []);
  return pending ? <div role="progressbar" aria-label="Loading page" aria-valuetext="Navigation in progress" data-testid="navigation-progress" className="navigation-progress pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] bg-rave-red/25"><span className="block h-full w-2/5 bg-rave-red" /></div> : null;
}
