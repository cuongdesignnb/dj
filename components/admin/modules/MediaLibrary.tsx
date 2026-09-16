'use client';

import { useEffect, useId, useState, useTransition } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Copy, LayoutGrid, List, Search, Trash2, Upload } from 'lucide-react';
import { deleteRecords, saveRecord } from '@/app/admin/actions';
import type { FilterConfig } from '@/lib/admin/common/schema';
import { inputClass } from '../form/FieldInput';
import { ConfirmDialog, Drawer, buttonClass } from '../ui/Dialog';
import { EmptyState, ErrorState } from '../ui/States';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  kind: string;
  alt: string;
  mimeType: string;
  usedBy: string[];
  updated: string;
}

const USED_LABEL: Record<string, string> = {
  events: 'Events',
  artists: 'Artists',
  products: 'Products',
  news: 'News',
  gallery: 'Gallery',
  partners: 'Partners',
};

export default function MediaLibrary({
  items,
  total,
  page,
  pageSize,
  query,
  filters,
  error,
  canEdit,
  canDelete,
}: {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  query: Record<string, string>;
  filters: FilterConfig[];
  error: string | null;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const searchId = useId();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(query.search ?? '');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [draft, setDraft] = useState({ name: '', alt: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const view = query.view === 'list' ? 'list' : 'grid';

  const navigate = (patch: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  useEffect(() => {
    if ((query.search ?? '') === search.trim()) return;
    const timer = window.setTimeout(() => navigate({ search: search.trim() }), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const open = (item: MediaItem) => {
    setSelected(item);
    setDraft({ name: item.name, alt: item.alt });
  };

  const copy = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(new URL(item.url, window.location.origin).toString());
      setCopied(item.id);
      toast('success', 'URL copied.');
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast('error', 'Could not copy. Select the URL and copy it manually.');
    }
  };

  const saveDetails = async () => {
    if (!selected) return;
    setSaving(true);
    const result = await saveRecord('media', selected.id, draft);
    setSaving(false);
    if (result.ok) {
      toast('success', result.message ?? 'Saved.');
      setSelected(null);
      start(() => router.refresh());
    } else {
      toast('error', result.error.fieldErrors ? Object.values(result.error.fieldErrors)[0] : result.error.message);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusyDelete(true);
    const result = await deleteRecords('media', [deleting.id]);
    setBusyDelete(false);
    if (result.ok) {
      toast('success', result.message ?? 'Deleted.');
      setDeleting(null);
      setSelected(null);
      start(() => router.refresh());
    } else {
      toast('error', result.error.message);
    }
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const control = 'min-h-[40px] rounded-[8px] border border-admin-border bg-admin-deep px-3 text-sm text-white focus:border-rave-red focus:outline-none';
  const dirty = !!selected && (draft.name !== selected.name || draft.alt !== selected.alt);

  return (
    <div className="rounded-[12px] border border-admin-border bg-admin-panel/90">
      <div role="search" aria-label="Filter media" className="flex flex-col gap-3 border-b border-admin-border p-3 sm:p-4 lg:flex-row lg:items-center">
        <label htmlFor={searchId} className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search media</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <input id={searchId} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search files..." className={`${control} w-full pl-9`} />
        </label>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <label key={filter.key}>
              <span className="sr-only">{filter.label}</span>
              <select value={query[filter.key] ?? ''} onChange={(e) => navigate({ [filter.key]: e.target.value })} className={control}>
                <option value="">{filter.label}: All</option>
                {filter.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {filter.label}: {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <div role="group" aria-label="View" className="ml-auto inline-flex rounded-[8px] border border-admin-border p-0.5">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                onClick={() => navigate({ view: v === 'grid' ? '' : 'list' }, false)}
                className={`grid h-9 w-9 place-items-center rounded-[6px] focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${view === v ? 'bg-white/10 text-white' : 'text-admin-muted hover:text-white'}`}
              >
                {v === 'grid' ? <LayoutGrid aria-hidden className="h-4 w-4" /> : <List aria-hidden className="h-4 w-4" />}
              </button>
            ))}
          </div>
          {canEdit && (
            <button type="button" onClick={() => setUploadOpen(true)} className={buttonClass.primary}>
              <Upload aria-hidden className="h-4 w-4" /> Upload
            </button>
          )}
        </div>
      </div>

      <div aria-busy={pending || undefined} className={`p-3 transition-opacity sm:p-4 ${pending ? 'opacity-60' : ''}`}>
        <p role="status" aria-live="polite" className="sr-only">
          {pending ? 'Loading…' : `${total} files`}
        </p>
        {error ? (
          <ErrorState title="Could not load media" message={error} />
        ) : items.length === 0 ? (
          <EmptyState title={query.search || filters.some((f) => query[f.key]) ? 'No matching files.' : 'No media yet.'} />
        ) : view === 'grid' ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => open(item)}
                  className="group block w-full overflow-hidden rounded-[10px] border border-admin-border bg-admin-deep text-left transition-colors hover:border-rave-red/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                >
                  <span className={`relative block aspect-[4/3] ${item.kind === 'logo' ? 'bg-[#15161c]' : ''}`}>
                    <Image src={item.url} alt="" fill sizes="(min-width: 1536px) 16vw, (min-width: 1024px) 22vw, 45vw" className={item.kind === 'logo' ? 'object-contain p-4' : 'object-cover'} />
                  </span>
                  <span className="block px-2.5 py-2">
                    <span className="block truncate text-sm text-white">{item.name}</span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <StatusBadge value={item.kind} />
                      <span className="text-[11px] text-admin-muted">{item.usedBy.length ? `Used in ${item.usedBy.length}` : 'Unused'}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <caption className="sr-only">Media files</caption>
              <thead>
                <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                  <th scope="col" className="py-2 pr-3 font-medium">Preview</th>
                  <th scope="col" className="py-2 pr-3 font-medium">File</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Type</th>
                  <th scope="col" className="py-2 pr-3 font-medium">Used by</th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-admin-border/60 last:border-0">
                    <td className="py-2 pr-3">
                      <span className="relative block h-10 w-14 overflow-hidden rounded-[6px] border border-admin-border">
                        <Image src={item.url} alt="" fill sizes="56px" className={item.kind === 'logo' ? 'object-contain p-1' : 'object-cover'} />
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="block text-white">{item.name}</span>
                      <span className="block truncate text-xs text-admin-muted">{item.url}</span>
                    </td>
                    <td className="py-2 pr-3">
                      <StatusBadge value={item.kind} />
                    </td>
                    <td className="py-2 pr-3 text-white/85">{item.usedBy.map((u) => USED_LABEL[u] ?? u).join(', ') || 'Not used'}</td>
                    <td className="py-2 text-right">
                      <button type="button" onClick={() => open(item)} className={buttonClass.ghost}>
                        Details<span className="sr-only"> for {item.name}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!error && total > 0 && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-admin-border px-4 py-3 text-sm text-admin-muted">
          <p>
            {total} {total === 1 ? 'file' : 'files'}
          </p>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) }, false)} className={buttonClass.secondary}>
              <ChevronLeft aria-hidden className="h-4 w-4" /> Previous
            </button>
            <span className="text-white">
              Page {page} of {pages}
            </span>
            <button type="button" disabled={page >= pages} onClick={() => navigate({ page: String(page + 1) }, false)} className={buttonClass.secondary}>
              Next <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="File details"
        description={selected?.url}
        footer={
          selected ? (
            <>
              {canDelete && (
                <button type="button" onClick={() => setDeleting(selected)} className={`${buttonClass.danger} mr-auto`}>
                  <Trash2 aria-hidden className="h-4 w-4" /> Delete
                </button>
              )}
              <button type="button" onClick={() => setSelected(null)} className={buttonClass.secondary}>
                Close
              </button>
              {canEdit && (
                <button type="button" disabled={!dirty || saving} onClick={saveDetails} className={buttonClass.primary}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              )}
            </>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className={`relative aspect-[4/3] overflow-hidden rounded-[10px] border border-admin-border ${selected.kind === 'logo' ? 'bg-[#15161c]' : 'bg-admin-deep'}`}>
              <Image src={selected.url} alt={selected.alt} fill sizes="440px" className={selected.kind === 'logo' ? 'object-contain p-6' : 'object-cover'} />
            </div>
            <button type="button" onClick={() => copy(selected)} className={`${buttonClass.secondary} w-full`}>
              {copied === selected.id ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
              {copied === selected.id ? 'Copied' : 'Copy URL'}
            </button>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">File name</span>
              <input value={draft.name} disabled={!canEdit} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
              <span className="mt-1 block text-xs text-admin-muted">Renames the library entry. The file address stays the same.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">Alt text</span>
              <textarea rows={3} value={draft.alt} disabled={!canEdit} maxLength={200} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} className={inputClass} />
              <span className="mt-1 block text-xs text-admin-muted">Describe what the image shows for people using screen readers.</span>
            </label>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-admin-muted">Type</dt>
                <dd className="text-white">{selected.mimeType}</dd>
              </div>
              <div>
                <dt className="text-xs text-admin-muted">Updated</dt>
                <dd className="text-white">{selected.updated}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-admin-muted">Used by</dt>
                <dd className="text-white">{selected.usedBy.map((u) => USED_LABEL[u] ?? u).join(', ') || 'Not used anywhere'}</dd>
              </div>
            </dl>
          </div>
        )}
      </Drawer>

      <Drawer open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload media" footer={<button type="button" onClick={() => setUploadOpen(false)} className={buttonClass.secondary}>Close</button>}>
        <div className="flex flex-col items-center rounded-[12px] border border-dashed border-white/20 px-6 py-12 text-center">
          <Upload aria-hidden className="h-9 w-9 text-admin-muted" strokeWidth={1.5} />
          <p className="mt-3 font-heading text-lg uppercase tracking-wide text-white">Upload unavailable</p>
          <p className="mt-1 max-w-xs text-sm text-admin-muted">
            Uploading needs file storage on the backend, which is not connected yet. Nothing can be uploaded from this build.
          </p>
          <button type="button" disabled className={`${buttonClass.secondary} mt-5`}>
            Choose files
          </button>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        busy={busyDelete}
        title="Delete this file?"
        entity={deleting?.name}
        consequence={
          deleting?.usedBy.length
            ? `It is used in ${deleting.usedBy.map((u) => USED_LABEL[u] ?? u).join(', ')}. Those places will show a missing image. This cannot be undone.`
            : 'The library entry will be removed. This cannot be undone.'
        }
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
