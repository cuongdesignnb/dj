'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(tone: ToastTone, message: string) => void>(() => {});

const ICONS = { success: CircleCheck, info: Info, warning: TriangleAlert, error: CircleAlert };
const TONES = {
  success: 'border-admin-success/40 text-admin-success',
  info: 'border-rave-blue/40 text-rave-blue',
  warning: 'border-admin-warning/40 text-admin-warning',
  error: 'border-rave-red/50 text-rave-red',
};

/**
 * Brief, non-blocking feedback. Callers only raise a success toast after the
 * action has actually resolved.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = next.current++;
      setItems((all) => [...all.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(92vw,380px)] flex-col gap-2">
        {/* Errors interrupt; everything else waits its turn. */}
        <div role="status" aria-live="polite" className="sr-only">
          {items.filter((t) => t.tone !== 'error').map((t) => t.message).join('. ')}
        </div>
        <div role="alert" className="sr-only">
          {items.filter((t) => t.tone === 'error').map((t) => t.message).join('. ')}
        </div>
        <AnimatePresence initial={false}>
          {items.map((toast) => {
            const Icon = ICONS[toast.tone];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto flex items-start gap-3 rounded-[10px] border bg-admin-panel2 px-4 py-3 text-sm shadow-xl ${TONES[toast.tone]}`}
              >
                <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="flex-1 text-white">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="-m-1 grid h-8 w-8 place-items-center rounded text-admin-muted hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                >
                  <X aria-hidden className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
