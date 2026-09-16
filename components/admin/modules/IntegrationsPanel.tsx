'use client';

import { useState } from 'react';
import { KeyRound, Plug } from 'lucide-react';
import { saveSingleton } from '@/app/admin/actions';
import { inputClass } from '../form/FieldInput';
import { ConfirmDialog, buttonClass } from '../ui/Dialog';
import StatusBadge from '../ui/StatusBadge';
import { useAdminSession } from '../ui/PermissionGate';
import { useToast } from '../ui/Toast';

interface Integration {
  id: string;
  name: string;
  description: string;
  state: string;
  keyConfigured: boolean;
  endpoint: string;
}

/**
 * One card per service. A stored key is only ever shown as "configured";
 * a new key is write-only and cleared as soon as it is submitted. Storing a
 * key does not mean the service works — only the backend can report that.
 */
export default function IntegrationsPanel({ initial, canEdit }: { initial: Record<string, unknown>; canEdit: boolean }) {
  const toast = useToast();
  const mock = useAdminSession()?.mock ?? false;
  const [items, setItems] = useState<Integration[]>((initial.items as Integration[] | undefined) ?? []);
  const [drafts, setDrafts] = useState<Record<string, { key: string; endpoint: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Integration | null>(null);

  const draftFor = (item: Integration) => drafts[item.id] ?? { key: '', endpoint: item.endpoint ?? '' };

  const save = async (item: Integration) => {
    const draft = draftFor(item);
    setBusy(item.id);
    const payload = {
      items: items.map((i) => (i.id === item.id ? { ...i, newKey: draft.key, endpoint: draft.endpoint.trim() } : { ...i, newKey: '' })),
    };
    const result = await saveSingleton('settings-integrations', payload);
    setBusy(null);
    setConfirm(null);
    // The key leaves the browser state whatever the outcome.
    setDrafts((d) => ({ ...d, [item.id]: { key: '', endpoint: draft.endpoint } }));
    if (result.ok) {
      setItems((result.data.items as Integration[] | undefined) ?? items);
      toast(result.message?.startsWith('Demo') ? 'warning' : 'success', result.message ?? 'Saved.');
    } else {
      toast('error', result.error.message);
    }
  };

  return (
    <>
      <p className="mb-5 rounded-[10px] border border-admin-border bg-white/[0.03] px-4 py-3 text-sm text-admin-muted">
        Nothing is connected in this build. Keys are stored write-only and are never shown again. A connection is only marked
        Connected when the backend confirms it.
      </p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((item) => {
          const draft = draftFor(item);
          const keyId = `key-${item.id}`;
          const endpointId = `endpoint-${item.id}`;
          return (
            <li key={item.id} className="flex flex-col rounded-[12px] border border-admin-border bg-admin-panel/90 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-white/[0.05] text-admin-muted">
                    <Plug aria-hidden className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-heading text-base font-semibold uppercase tracking-wide text-white">{item.name}</span>
                    <span className="block text-xs text-admin-muted">{item.description}</span>
                  </span>
                </span>
                <StatusBadge value={item.state} />
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm">
                <KeyRound aria-hidden className="h-4 w-4 text-admin-muted" />
                <span className="text-admin-muted">API key:</span>
                <span className="font-mono text-white">{item.keyConfigured ? '•••••••• (stored)' : 'Not set'}</span>
              </p>
              {canEdit && (
                <form
                  className="mt-4 space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (draft.key) setConfirm(item);
                    else void save(item);
                  }}
                >
                  <div>
                    <label htmlFor={keyId} className="mb-1 block text-xs text-admin-muted">
                      {item.keyConfigured ? 'Replace key' : 'Add key'}
                    </label>
                    <input
                      id={keyId}
                      type="password"
                      autoComplete="off"
                      spellCheck={false}
                      value={draft.key}
                      onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: { ...draft, key: e.target.value } }))}
                      placeholder="Paste a key to store it"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={endpointId} className="mb-1 block text-xs text-admin-muted">
                      Endpoint URL (optional)
                    </label>
                    <input
                      id={endpointId}
                      value={draft.endpoint}
                      type="url"
                      placeholder="https://"
                      onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: { ...draft, endpoint: e.target.value } }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={busy === item.id} className={buttonClass.secondary}>
                      {busy === item.id ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" disabled title="Needs the backend to test the connection" className={buttonClass.ghost}>
                      Test connection
                    </button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={!!confirm}
        tone="primary"
        busy={!!busy}
        title={confirm?.keyConfigured ? 'Replace the stored key?' : 'Store this key?'}
        entity={confirm?.name}
        consequence={
          mock
            ? 'Demo mode: there is no secure storage, so the key will be discarded and nothing changes.'
            : 'The key is sent to the server and cannot be viewed again. Anything using the old key stops working once the backend switches over.'
        }
        confirmLabel="Store key"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && save(confirm)}
      />
    </>
  );
}
