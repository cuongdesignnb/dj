'use client';

import type { ReactNode } from 'react';
import { ToastProvider as SharedToastProvider, useToast } from '@/components/shared/toast/ToastProvider';

export type { ToastTone } from '@/components/shared/toast/ToastProvider';
export { useToast };

/** Admin-themed toasts; the shared provider also sits above open admin dialogs. */
export function ToastProvider({ children }: { children: ReactNode }) {
  return <SharedToastProvider variant="admin">{children}</SharedToastProvider>;
}
