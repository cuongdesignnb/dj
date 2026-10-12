'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';
export type ToastFn = (tone: ToastTone, message: string) => void;

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<ToastFn>(() => {});

const ICONS = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleAlert };

const THEMES = {
  admin: {
    stack: 'bottom-4 right-4',
    card: 'bg-admin-panel2',
    muted: 'text-admin-muted',
    tones: { success: 'border-admin-success/40 text-admin-success', info: 'border-rave-blue/40 text-rave-blue', warning: 'border-admin-warning/40 text-admin-warning', error: 'border-rave-red/50 text-rave-red' },
  },
  // The public cart button sits bottom-right, so site toasts stack bottom-left.
  site: {
    stack: 'bottom-4 left-4',
    card: 'bg-rave-panel/95 backdrop-blur',
    muted: 'text-rave-muted',
    tones: { success: 'border-emerald-400/40 text-emerald-300', info: 'border-white/20 text-white', warning: 'border-amber-300/40 text-amber-200', error: 'border-rave-red/60 text-rave-red' },
  },
} as const;

/** The top-most open modal <dialog>; everything outside it is inert while it is open. */
function topModalDialog(): Element | null {
  const modals = Array.from(document.querySelectorAll('dialog[open]')).filter((dialog) => dialog.matches(':modal'));
  return modals[modals.length - 1] ?? null;
}

/**
 * Brief, non-blocking feedback for the whole site (variant "site") and the
 * admin (variant "admin"). Callers raise a success toast only after the action
 * has actually resolved; inline messages stay as the lasting record.
 *
 * Admin drawers and dialogs use native modal <dialog>: they sit in the browser
 * top layer and make everything outside them inert. While one is open the stack
 * is rendered inside it, and it is a manual popover re-shown on every toast so
 * it is painted above the dialog too.
 */
export function ToastProvider({ children, variant = 'site' }: { children: ReactNode; variant?: 'admin' | 'site' }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [host, setHost] = useState<Element | null>(null);
  const next = useRef(1);
  const stack = useRef<HTMLDivElement>(null);
  const theme = THEMES[variant];

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback<ToastFn>(
    (tone, message) => {
      const id = next.current++;
      setHost(topModalDialog());
      setItems((all) => [...all.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500);
    },
    [dismiss],
  );

  useEffect(() => {
    const element = stack.current;
    if (!element || typeof element.showPopover !== 'function') return;
    try {
      if (element.matches(':popover-open')) element.hidePopover();
      if (items.length) element.showPopover();
    } catch {
      // Browsers without the Popover API keep the fixed z-index fallback.
    }
  }, [items, host]);

  const value = useMemo(() => push, [push]);

  const stackElement = (
    <div
      ref={stack}
      popover="manual"
      data-toast-stack={variant}
      className={`pointer-events-none fixed inset-auto z-[120] m-0 flex w-[min(92vw,380px)] flex-col gap-2 overflow-visible border-0 bg-transparent p-0 ${theme.stack}`}
    >
      <AnimatePresence initial={false}>
        {items.map((toast) => {
          const Icon = ICONS[toast.tone];
          return (
            <motion.div
              key={toast.id}
              data-toast={toast.tone}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm shadow-xl ${theme.card} ${theme.tones[toast.tone]}`}
            >
              <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-white">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className={`-m-1 grid h-8 w-8 place-items-center rounded ${theme.muted} hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red`}
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Errors interrupt; everything else waits its turn. Always mounted so announcements are reliable. */}
      <div role="status" aria-live="polite" className="sr-only">
        {items.filter((t) => t.tone !== 'error').map((t) => t.message).join('. ')}
      </div>
      <div role="alert" className="sr-only">
        {items.filter((t) => t.tone === 'error').map((t) => t.message).join('. ')}
      </div>
      {host?.isConnected ? createPortal(stackElement, host) : stackElement}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}
