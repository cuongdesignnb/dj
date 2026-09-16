'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { archiveRecords, deleteRecords, duplicateRecord } from '@/app/admin/actions';
import { PAGE_SIZES } from '@/lib/admin/common/pagination';
import type { FilterConfig } from '@/lib/admin/common/schema';
import type { Cell, TableRow } from '@/lib/admin/common/table';
import { ConfirmDialog, buttonClass } from './Dialog';
import StatusBadge from './StatusBadge';
import { EmptyState, ErrorState } from './States';
import { useToast } from './Toast';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  hideOnMobile?: boolean;
}

type Query = Record<string, string>;

function CellView({ cell }: { cell: Cell }) {
  switch (cell.type) {
    case 'title':
      return (
        <div className="min-w-0">
          {cell.href ? (
            <Link href={cell.href} className="font-semibold text-white hover:text-rave-red focus:outline-none focus-visible:underline">
              {cell.text}
            </Link>
          ) : (
            <span className="font-semibold text-white">{cell.text}</span>
          )}
          {cell.sub && cell.sub !== '—' && <span className="block truncate text-xs text-admin-muted">{cell.sub}</span>}
        </div>
      );
    case 'status':
      return <StatusBadge value={cell.value} />;
    case 'image':
      return cell.src ? (
        <span className="relative block h-10 w-14 overflow-hidden rounded-[6px] border border-admin-border bg-admin-deep">
          <Image src={cell.src} alt={cell.alt} fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="text-admin-muted">—</span>
      );
    case 'bool':
      return cell.value ? (
        <span className="inline-flex items-center gap-1 text-admin-success">
          <Check aria-hidden className="h-4 w-4" /> Yes
        </span>
      ) : (
        <span className="text-admin-muted">No</span>
      );
    case 'list':
      return <span className="text-white/85">{cell.items.length ? cell.items.join(', ') : '—'}</span>;
    default:
      return <span className="text-white/85">{cell.text}</span>;
  }
}

function RowMenu({
  row,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  row: TableRow;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof PointerEvent && box.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const item = 'flex w-full min-h-[36px] items-center gap-2 rounded-[6px] px-3 text-left text-sm hover:bg-white/5 focus:bg-white/5 focus:outline-none';
  const hasAny = row.links.view || row.links.edit || row.links.preview || row.can.duplicate || row.can.archive || row.can.delete;
  if (!hasAny) return null;

  return (
    <div ref={box} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Actions for ${row.label}`}
        className="grid h-9 w-9 place-items-center rounded-[8px] text-admin-muted hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
      >
        <MoreHorizontal aria-hidden className="h-4 w-4" />
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 top-[calc(100%+4px)] z-30 w-44 rounded-[10px] border border-admin-border bg-admin-panel2 p-1.5 text-white shadow-2xl">
          {row.links.view && (
            <Link role="menuitem" href={row.links.view} className={item}>
              <Eye aria-hidden className="h-4 w-4 text-admin-muted" /> View
            </Link>
          )}
          {row.links.edit && (
            <Link role="menuitem" href={row.links.edit} className={item}>
              <Pencil aria-hidden className="h-4 w-4 text-admin-muted" /> Edit
            </Link>
          )}
          {row.can.duplicate && (
            <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onDuplicate(); }}>
              <Copy aria-hidden className="h-4 w-4 text-admin-muted" /> Duplicate
            </button>
          )}
          {row.links.preview && (
            <a
              role="menuitem"
              href={row.links.preview}
              target={row.links.preview.startsWith('/admin') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={item}
            >
              <ExternalLink aria-hidden className="h-4 w-4 text-admin-muted" /> Preview
            </a>
          )}
          {row.can.archive && (
            <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onArchive(); }}>
              <Archive aria-hidden className="h-4 w-4 text-admin-muted" /> Archive
            </button>
          )}
          {row.can.delete && (
            <button role="menuitem" type="button" className={`${item} text-[#FF6B82]`} onClick={() => { setOpen(false); onDelete(); }}>
              <Trash2 aria-hidden className="h-4 w-4" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type Pending = { kind: 'archive' | 'delete'; ids: string[]; label: string } | null;

/**
 * The one table used by every list screen. Search, filters, sort and page
 * live in the URL, so a view can be reloaded or shared and the server fetches
 * exactly one page.
 */
export default function DataTable({
  resourceKey,
  label,
  columns,
  rows,
  total,
  page,
  pageSize,
  query,
  filters,
  empty,
  error,
  bulk,
  notice,
}: {
  resourceKey: string;
  label: string;
  columns: TableColumn[];
  rows: TableRow[];
  total: number;
  page: number;
  pageSize: number;
  query: Query;
  filters: FilterConfig[];
  empty: { title: string; description?: string; action?: { label: string; href: string } };
  error?: string | null;
  bulk: { archive: boolean; delete: boolean };
  notice?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const searchId = useId();
  const [pending, start] = useTransition();
  const [search, setSearch] = useState(query.search ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [rowsKey, setRowsKey] = useState(rows);

  // A new page of rows clears the selection (derived during render).
  if (rowsKey !== rows) {
    setRowsKey(rows);
    setSelected(new Set());
  }

  const navigate = (patch: Query, resetPage = true) => {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage && !('page' in patch)) next.delete('page');
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  // Debounced search.
  useEffect(() => {
    if ((query.search ?? '') === search.trim()) return;
    const timer = window.setTimeout(() => navigate({ search: search.trim() }), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const sortBy = (key: string) => {
    const same = query.sort === key;
    navigate({ sort: key, dir: same && query.dir !== 'asc' ? 'asc' : same ? 'desc' : 'asc' }, false);
  };

  const run = async (kind: 'archive' | 'delete', ids: string[]) => {
    setBusy(true);
    const result = kind === 'delete' ? await deleteRecords(resourceKey, ids) : await archiveRecords(resourceKey, ids);
    setBusy(false);
    setConfirm(null);
    if (result.ok) {
      toast('success', result.message ?? 'Done.');
      setSelected(new Set());
      start(() => router.refresh());
    } else {
      toast('error', result.error.message);
    }
  };

  const duplicate = async (row: TableRow) => {
    const result = await duplicateRecord(resourceKey, row.id);
    if (result.ok) {
      toast('success', result.message ?? 'Copy created.');
      start(() => router.refresh());
    } else {
      toast('error', result.error.message);
    }
  };

  const activeFilters = filters.filter((f) => query[f.key]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectable = bulk.archive || bulk.delete;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggleOne = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortIcon = (key: string) =>
    query.sort !== key ? (
      <ArrowUpDown aria-hidden className="h-3.5 w-3.5 opacity-50" />
    ) : query.dir === 'asc' ? (
      <ArrowUp aria-hidden className="h-3.5 w-3.5 text-rave-red" />
    ) : (
      <ArrowDown aria-hidden className="h-3.5 w-3.5 text-rave-red" />
    );

  const control =
    'min-h-[40px] rounded-[8px] border border-admin-border bg-admin-deep px-3 text-sm text-white focus:border-rave-red focus:outline-none';

  return (
    <div className="rounded-[12px] border border-admin-border bg-admin-panel/90">
      {/* Toolbar */}
      <div role="search" aria-label={`Filter ${label}`} className="flex flex-col gap-3 border-b border-admin-border p-3 sm:p-4 lg:flex-row lg:items-center">
        <label htmlFor={searchId} className="relative block w-full lg:max-w-xs">
          <span className="sr-only">Search {label}</span>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className={`${control} w-full pl-9`}
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          {filters.map((filter) => (
            <label key={filter.key} className="flex min-w-0 items-center [&>select]:w-full sm:[&>select]:w-auto">
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
          {(activeFilters.length > 0 || query.search) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                navigate(Object.fromEntries([...filters.map((f) => [f.key, '']), ['search', '']]));
              }}
              className={buttonClass.ghost}
            >
              <X aria-hidden className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {notice && <p className="border-b border-admin-border bg-admin-warning/[0.06] px-4 py-2 text-xs text-admin-warning">{notice}</p>}

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-admin-border bg-rave-red/[0.06] px-4 py-2">
          <span className="text-sm text-white">{selected.size} selected</span>
          {bulk.archive && (
            <button type="button" className={buttonClass.secondary} onClick={() => setConfirm({ kind: 'archive', ids: [...selected], label: `${selected.size} items` })}>
              <Archive aria-hidden className="h-4 w-4" /> Archive
            </button>
          )}
          {bulk.delete && (
            <button type="button" className={buttonClass.danger} onClick={() => setConfirm({ kind: 'delete', ids: [...selected], label: `${selected.size} items` })}>
              <Trash2 aria-hidden className="h-4 w-4" /> Delete
            </button>
          )}
          <button type="button" className={buttonClass.ghost} onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      <div aria-busy={pending || undefined} className={`transition-opacity ${pending ? 'opacity-60' : ''}`}>
        <p role="status" aria-live="polite" className="sr-only">
          {pending ? 'Loading…' : `${total} ${total === 1 ? 'result' : 'results'}`}
        </p>

        {error ? (
          <div className="p-4">
            <ErrorState message={error} title={`Could not load ${label.toLowerCase()}`} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={activeFilters.length || query.search ? 'No matching results.' : empty.title}
              description={activeFilters.length || query.search ? 'Try different search terms or filters.' : empty.description}
              action={activeFilters.length || query.search ? undefined : empty.action}
            />
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="relative hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <caption className="sr-only">{label}</caption>
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs uppercase tracking-wider text-admin-muted">
                    {selectable && (
                      <th scope="col" className="w-10 px-4 py-3">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all on this page" className="h-4 w-4 accent-[#FF173D]" />
                      </th>
                    )}
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        scope="col"
                        aria-sort={query.sort === column.key ? (query.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                        className={`px-3 py-3 font-medium ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}`}
                      >
                        {column.sortable ? (
                          <button type="button" onClick={() => sortBy(column.key)} className="inline-flex items-center gap-1 uppercase hover:text-white focus:outline-none focus-visible:text-white focus-visible:underline">
                            {column.label}
                            {sortIcon(column.key)}
                          </button>
                        ) : (
                          column.label
                        )}
                      </th>
                    ))}
                    <th scope="col" className="w-12 px-3 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={`border-b border-admin-border/70 last:border-0 hover:bg-white/[0.02] ${row.archived ? 'opacity-60' : ''}`}>
                      {selectable && (
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} aria-label={`Select ${row.label}`} className="h-4 w-4 accent-[#FF173D]" />
                        </td>
                      )}
                      {row.cells.map((cell, i) => (
                        <td
                          key={columns[i].key}
                          className={`px-3 py-3 align-middle ${columns[i].align === 'right' ? 'text-right' : columns[i].align === 'center' ? 'text-center' : ''}`}
                        >
                          <CellView cell={cell} />
                        </td>
                      ))}
                      <td className="px-3 py-3 text-right">
                        <RowMenu
                          row={row}
                          onDuplicate={() => duplicate(row)}
                          onArchive={() => setConfirm({ kind: 'archive', ids: [row.id], label: row.label })}
                          onDelete={() => setConfirm({ kind: 'delete', ids: [row.id], label: row.label })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phones: stacked cards */}
            <ul className="divide-y divide-admin-border md:hidden">
              {rows.map((row) => (
                <li key={row.id} className={`p-4 ${row.archived ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    {selectable && (
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} aria-label={`Select ${row.label}`} className="mt-1 h-5 w-5 accent-[#FF173D]" />
                    )}
                    <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                      {row.cells.map((cell, i) =>
                        columns[i].hideOnMobile ? null : cell.type === 'title' ? (
                          <div key={columns[i].key} className="col-span-2">
                            <dt className="sr-only">{columns[i].label}</dt>
                            <dd>
                              <CellView cell={cell} />
                            </dd>
                          </div>
                        ) : (
                          <div key={columns[i].key} className="col-span-2 grid grid-cols-subgrid">
                            <dt className="text-xs text-admin-muted">{columns[i].label}</dt>
                            <dd className="min-w-0">
                              <CellView cell={cell} />
                            </dd>
                          </div>
                        ),
                      )}
                    </dl>
                    <RowMenu
                      row={row}
                      onDuplicate={() => duplicate(row)}
                      onArchive={() => setConfirm({ kind: 'archive', ids: [row.id], label: row.label })}
                      onDelete={() => setConfirm({ kind: 'delete', ids: [row.id], label: row.label })}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Pagination */}
      {!error && total > 0 && (
        <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-admin-border px-4 py-3 text-sm text-admin-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {from}–{to} of {total}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Rows</span>
              <select value={String(pageSize)} onChange={(e) => navigate({ pageSize: e.target.value })} className={control}>
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => navigate({ page: String(page - 1) }, false)}
              className={buttonClass.secondary}
            >
              <ChevronLeft aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Previous</span>
            </button>
            <span className="px-1 text-white" aria-current="page">
              Page {page} of {pages}
            </span>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => navigate({ page: String(page + 1) }, false)}
              className={buttonClass.secondary}
            >
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}

      <ConfirmDialog
        open={!!confirm}
        busy={busy}
        title={confirm?.kind === 'delete' ? 'Delete permanently?' : 'Archive?'}
        entity={confirm?.label}
        consequence={
          confirm?.kind === 'delete'
            ? 'This cannot be undone. Anything that links to it will lose that link.'
            : 'It will be hidden from the public site. You can restore it by changing its status.'
        }
        confirmLabel={confirm?.kind === 'delete' ? 'Delete' : 'Archive'}
        tone={confirm?.kind === 'delete' ? 'danger' : 'primary'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && run(confirm.kind, confirm.ids)}
      />
    </div>
  );
}
