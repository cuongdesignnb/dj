'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { buttonClass } from './buttonClass';

/**
 * Modal and drawer on the native <dialog> element: the page behind is inert,
 * focus stays inside, Escape closes, and focus returns to the opener.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'modal',
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'modal' | 'drawer';
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const width = size === 'sm' ? 'w-[min(94vw,420px)]' : size === 'lg' ? 'w-[min(96vw,960px)]' : 'w-[min(94vw,640px)]';
  const placement =
    variant === 'drawer'
      ? `m-0 ml-auto h-dvh max-h-dvh ${size === 'lg' ? 'w-[min(100vw,720px)]' : 'w-[min(100vw,480px)]'} max-w-none rounded-none border-l`
      : `m-auto max-h-[88dvh] ${width} rounded-[14px] border`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`${placement} border-admin-border bg-admin-panel p-0 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="flex max-h-[inherit] min-h-0 flex-col" style={variant === 'drawer' ? { height: '100%' } : undefined}>
          <div className="flex items-start justify-between gap-3 border-b border-admin-border px-5 py-4">
            <div>
              <h2 id={titleId} className="font-heading text-lg font-semibold uppercase tracking-wide">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-admin-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] text-admin-muted hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-admin-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export const Drawer = (props: Omit<Parameters<typeof Modal>[0], 'variant'>) => <Modal {...props} variant="drawer" />;

export { buttonClass };

/** Required before delete, archive, disable, remove and discard. */
export function ConfirmDialog({
  open,
  title,
  entity,
  consequence,
  confirmLabel,
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  entity?: string;
  consequence: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={busy} className={buttonClass.secondary} autoFocus>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={busy} aria-busy={busy || undefined} className={buttonClass[tone]}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <TriangleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-admin-warning" />
        <div className="text-sm">
          {entity && <p className="font-semibold text-white">{entity}</p>}
          <p className="mt-1 text-admin-muted">{consequence}</p>
        </div>
      </div>
    </Modal>
  );
}
