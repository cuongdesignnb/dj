'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { driver, type Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './tour.css';
import { useAdminSession } from '../ui/PermissionGate';
import { guideForPath, tourForPath, tourStorageKey, visibleElement, type AdminTour, type TourProgress } from '@/lib/admin/tour/tours';

interface TourContextValue {
  /** Replays the guide for the current page (or the general overview). */
  startGuide: () => void;
}

const TourContext = createContext<TourContextValue>({ startGuide: () => {} });

/** Opt-in used by end-to-end tests; automated browsers never get tours on their own. */
const AUTOMATION_OPT_IN = 'connection-rave:admin-tour:allow-automation';

function readProgress(key: string): TourProgress {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed as TourProgress : {};
  } catch {
    return {};
  }
}

function writeProgress(key: string, tourId: string, status: 'done' | 'skipped') {
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...readProgress(key), [tourId]: status }));
  } catch {
    // Private windows can refuse storage; the tour then simply shows again next time.
  }
}

function automationBlocksAutoStart() {
  try {
    return navigator.webdriver === true && window.localStorage.getItem(AUTOMATION_OPT_IN) !== '1';
  } catch {
    return navigator.webdriver === true;
  }
}

/** Waits for the page to render at least one of the tour's anchors (editors load their data first). */
function waitForAnchors(tour: AdminTour, timeoutMs = 4000): Promise<void> {
  const ready = () => tour.steps.some((step) => step.target && visibleElement(step.target));
  if (ready()) return Promise.resolve();
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); window.clearTimeout(timer); resolve(); } });
    const timer = window.setTimeout(() => { observer.disconnect(); resolve(); }, timeoutMs);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });
}

export function AdminTourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '';
  const session = useAdminSession();
  const storageKey = tourStorageKey(session?.userId || 'anonymous');
  const active = useRef<Driver | null>(null);

  const run = useCallback(async (tour: AdminTour) => {
    if (active.current?.isActive()) return;
    await waitForAnchors(tour);
    // Only steps the editor can actually see, so "2 of 5" is honest.
    const steps = tour.steps.filter((step) => !step.target || visibleElement(step.target));
    if (!steps.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let finished = false;
    const instance = driver({
      steps: steps.map((step) => ({
        element: step.target ? () => visibleElement(step.target!) ?? document.body : undefined,
        popover: { title: step.title, description: step.body, side: step.side, align: 'start' },
      })),
      animate: !reduced,
      smoothScroll: !reduced,
      showProgress: steps.length > 1,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      allowClose: true,
      overlayOpacity: 0.65,
      stagePadding: 6,
      popoverClass: 'cr-tour',
      onPopoverRender: (popover, { driver: current }) => {
        popover.wrapper.setAttribute('data-tour-popover', tour.id);
        if (current.isLastStep()) return;
        const skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'cr-tour-skip';
        skip.textContent = 'Skip tour';
        skip.addEventListener('click', () => { writeProgress(storageKey, tour.id, 'skipped'); active.current = null; current.destroy(); });
        popover.footer.prepend(skip);
      },
      onNextClick: (_element, _step, { driver: current }) => {
        if (current.isLastStep()) finished = true;
        current.moveNext();
      },
      // Runs for Done, Escape, the close button and overlay clicks, even mid-animation.
      onDestroyStarted: (_element, _step, { driver: current }) => {
        writeProgress(storageKey, tour.id, finished ? 'done' : 'skipped');
        active.current = null;
        current.destroy();
      },
    });
    active.current = instance;
    instance.drive();
  }, [storageKey]);

  // First visit to a page with a guide: show it once per editor, unless they skipped or finished it.
  useEffect(() => {
    const tour = tourForPath(pathname);
    if (!tour || automationBlocksAutoStart()) return;
    if (readProgress(storageKey)[tour.id]) return;
    const timer = window.setTimeout(() => { void run(tour); }, 600);
    return () => window.clearTimeout(timer);
  }, [pathname, run, storageKey]);

  useEffect(() => () => { active.current?.destroy(); }, [pathname]);

  const value = useMemo<TourContextValue>(() => ({ startGuide: () => { void run(guideForPath(pathname)); } }), [pathname, run]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useAdminTour() {
  return useContext(TourContext);
}
