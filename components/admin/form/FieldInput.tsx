'use client';

import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Heading,
  ImageIcon,
  List,
  Pilcrow,
  Plus,
  Quote,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from '@/lib/admin/auth/permissions';
import { getPath, setPath, slugify } from '@/lib/admin/common/paths';
import type { FieldConfig, Option } from '@/lib/admin/common/schema';
import { ConfirmDialog, Modal, buttonClass } from '../ui/Dialog';

export interface MediaChoice {
  src: string;
  label: string;
  alt: string;
}

export interface FieldContext {
  language: 'en' | 'vi';
  optionSets: Record<string, Option[]>;
  media: MediaChoice[];
  readOnly: boolean;
  /** Field path → error message. */
  errors: Record<string, string>;
}

export const inputClass =
  'w-full min-h-[42px] rounded-[8px] border border-admin-border bg-admin-deep px-3 py-2 text-sm text-white placeholder:text-white/30 transition-colors focus:border-rave-red focus:outline-none focus:ring-1 focus:ring-rave-red/60 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-rave-red';

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isVisible(field: FieldConfig, values: unknown): boolean {
  if (!field.showWhen) return true;
  return field.showWhen.in.includes(getPath(values, field.showWhen.key) as string | boolean);
}

/** Label, help and error wrapper with the ids wired up for screen readers. */
function Shell({
  id,
  field,
  error,
  children,
  counter,
  asGroup,
  extra,
}: {
  id: string;
  field: FieldConfig;
  error?: string;
  children: ReactNode;
  counter?: string;
  asGroup?: boolean;
  extra?: ReactNode;
}) {
  const label = (
    <>
      {field.label}
      {field.required && (
        <span className="ml-0.5 text-rave-red" aria-hidden>
          *
        </span>
      )}
      {field.required && <span className="sr-only"> (required)</span>}
    </>
  );
  const Wrapper = asGroup ? 'fieldset' : 'div';
  return (
    <Wrapper data-field={field.key} className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        {asGroup ? (
          <legend className="text-sm font-medium text-white/90">{label}</legend>
        ) : (
          <label htmlFor={id} className="text-sm font-medium text-white/90">
            {label}
          </label>
        )}
        <span className="flex items-center gap-2">
          {extra}
          {counter && <span className="text-xs tabular-nums text-admin-muted">{counter}</span>}
        </span>
      </div>
      {children}
      {field.help && !error && (
        <p id={`${id}-help`} className="mt-1 text-xs text-admin-muted">
          {field.help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-[#FF6B82]">
          {error}
        </p>
      )}
    </Wrapper>
  );
}

function describedBy(id: string, field: FieldConfig, error?: string) {
  if (error) return `${id}-error`;
  return field.help ? `${id}-help` : undefined;
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export function MediaPicker({
  open,
  onClose,
  onPick,
  media,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (choice: MediaChoice) => void;
  media: MediaChoice[];
}) {
  const [query, setQuery] = useState('');
  const shown = media.filter((m) => m.label.toLowerCase().includes(query.toLowerCase()));
  return (
    <Modal open={open} onClose={onClose} title="Choose from media library" description="Only files already in the library can be selected." size="lg">
      <label className="mb-4 block">
        <span className="sr-only">Search media</span>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files..." className={inputClass} />
      </label>
      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-admin-muted">No files match.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {shown.map((m) => (
            <li key={m.src}>
              <button
                type="button"
                onClick={() => onPick(m)}
                className="group block w-full overflow-hidden rounded-[10px] border border-admin-border bg-admin-deep text-left hover:border-rave-red/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
              >
                <span className="relative block aspect-[4/3]">
                  <Image src={m.src} alt="" fill sizes="200px" className="object-cover" />
                </span>
                <span className="block truncate px-2 py-1.5 text-xs text-white/85">{m.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function MediaField({ id, field, value, onChange, ctx, error }: FieldProps) {
  const [open, setOpen] = useState(false);
  const ref = isRecord(value) ? (value as { src?: string; alt?: string; mediaId?: string | null }) : null;
  return (
    <Shell id={id} field={field} error={error} asGroup>
      <div className="rounded-[10px] border border-admin-border bg-admin-deep p-3">
        {ref?.src ? (
          <div className="flex gap-3">
            <span className="relative block h-20 w-28 shrink-0 overflow-hidden rounded-[6px] border border-admin-border">
              <Image src={ref.src} alt="" fill sizes="112px" className="object-cover" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="truncate text-xs text-admin-muted">{ref.src}</p>
              <label className="block">
                <span className="mb-1 block text-xs text-admin-muted">Alt text</span>
                <input
                  id={id}
                  value={ref.alt ?? ''}
                  disabled={ctx.readOnly}
                  onChange={(e) => onChange({ ...ref, alt: e.target.value })}
                  placeholder="Describe the image"
                  aria-describedby={describedBy(id, field, error)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-2 py-3 text-sm text-admin-muted">
            <ImageIcon aria-hidden className="h-4 w-4" /> No image selected.
          </p>
        )}
        {!ctx.readOnly && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className={buttonClass.secondary}>
              <ImageIcon aria-hidden className="h-4 w-4" /> {ref?.src ? 'Replace' : 'Choose image'}
            </button>
            <button type="button" disabled title="Uploading needs the media service" className={buttonClass.ghost}>
              <Upload aria-hidden className="h-4 w-4" /> Upload unavailable
            </button>
            {ref?.src && (
              <button type="button" onClick={() => onChange(null)} className={buttonClass.ghost}>
                <X aria-hidden className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        )}
      </div>
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        media={ctx.media}
        onPick={(m) => {
          onChange({ mediaId: null, src: m.src, alt: ref?.alt || m.alt });
          setOpen(false);
        }}
      />
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Lists: tags, multiselect, permissions
// ---------------------------------------------------------------------------

function TagsField({ id, field, value, onChange, ctx, error }: FieldProps) {
  const tags = Array.isArray(value) ? value.map(String) : [];
  const [draft, setDraft] = useState('');
  const add = () => {
    const tag = draft.trim();
    if (tag && !tags.includes(tag)) onChange([...tags, tag]);
    setDraft('');
  };
  return (
    <Shell id={id} field={field} error={error}>
      <div className="rounded-[8px] border border-admin-border bg-admin-deep p-2">
        {tags.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <li key={`${tag}-${i}`} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] py-0.5 pl-2.5 pr-1 text-xs text-white">
                {tag}
                {!ctx.readOnly && (
                  <button
                    type="button"
                    onClick={() => onChange(tags.filter((_, j) => j !== i))}
                    aria-label={`Remove ${tag}`}
                    className="grid h-5 w-5 place-items-center rounded-full text-admin-muted hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-rave-red"
                  >
                    <X aria-hidden className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {!ctx.readOnly && (
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                add();
              } else if (e.key === 'Backspace' && !draft && tags.length) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={add}
            placeholder={field.placeholder ?? 'Type and press Enter'}
            aria-describedby={describedBy(id, field, error)}
            className="w-full bg-transparent px-1 py-1 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        )}
      </div>
    </Shell>
  );
}

function MultiSelectField({ id, field, value, onChange, ctx, error, options }: FieldProps & { options: Option[] }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  return (
    <Shell id={id} field={field} error={error} asGroup>
      {options.length === 0 ? (
        <p className="text-sm text-admin-muted">Nothing to choose from yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2" aria-describedby={describedBy(id, field, error)}>
          {options.map((o) => {
            const on = selected.includes(o.value);
            return (
              <label
                key={o.value}
                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-rave-red ${
                  on ? 'border-rave-red/70 bg-rave-red/15 text-white' : 'border-admin-border text-white/75 hover:border-white/30'
                } ${ctx.readOnly ? 'pointer-events-none opacity-70' : ''}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={ctx.readOnly}
                  onChange={() => onChange(on ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
                />
                {o.label}
              </label>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

function PermissionsField({ id, field, value, onChange, ctx, error }: FieldProps) {
  const granted = new Set(Array.isArray(value) ? value.map(String) : []);
  const toggle = (perm: string) => {
    const next = new Set(granted);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    onChange([...next]);
  };
  return (
    <Shell id={id} field={field} error={error} asGroup>
      <div className="relative overflow-x-auto rounded-[10px] border border-admin-border">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Permissions by module</caption>
          <thead>
            <tr className="border-b border-admin-border bg-admin-deep text-left text-xs uppercase tracking-wider text-admin-muted">
              <th scope="col" className="px-3 py-2.5 font-medium">
                Module
              </th>
              {PERMISSION_ACTIONS.map((a) => (
                <th key={a} scope="col" className="px-2 py-2.5 text-center font-medium">
                  {a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((m) => {
              const manage = granted.has(`${m.id}.manage`);
              return (
                <tr key={m.id} className="border-b border-admin-border/60 last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-white">
                    {m.label}
                  </th>
                  {PERMISSION_ACTIONS.map((a) => {
                    const perm = `${m.id}.${a}`;
                    const implied = manage && a !== 'manage';
                    return (
                      <td key={a} className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={granted.has(perm) || implied}
                          disabled={ctx.readOnly || implied}
                          onChange={() => toggle(perm)}
                          aria-label={`${m.label}: ${a}${implied ? ' (included in manage)' : ''}`}
                          className="h-4 w-4 accent-[#FF173D]"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

// ---------------------------------------------------------------------------
// Structured article body
// ---------------------------------------------------------------------------

type Block = Json & { id: string; type: string };

const BLOCK_TYPES = [
  { type: 'paragraph', label: 'Paragraph', icon: Pilcrow },
  { type: 'heading', label: 'Heading', icon: Heading },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'quote', label: 'Quote', icon: Quote },
  { type: 'list', label: 'List', icon: List },
] as const;

function newBlock(type: string, n: number): Block {
  const id = `block-new-${n}`;
  switch (type) {
    case 'heading':
      return { id, type, level: 2, text: '' };
    case 'image':
      return { id, type, image: { src: '', alt: '', caption: '' } };
    case 'quote':
      return { id, type, text: '', attribution: null };
    case 'list':
      return { id, type, style: 'bullet', items: [] };
    default:
      return { id, type: 'paragraph', text: '' };
  }
}

function BlocksField({ id, field, value, onChange, ctx, error }: FieldProps) {
  const blocks = (Array.isArray(value) ? value : []) as Block[];
  const [removing, setRemoving] = useState<number | null>(null);
  const update = (i: number, patch: Json) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...blocks];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };
  const serial = blocks.length + blocks.reduce((max, b) => Math.max(max, Number(String(b.id).match(/(\d+)$/)?.[1] ?? 0)), 0);

  return (
    <Shell id={id} field={field} error={error} asGroup>
      <div className="rounded-[10px] border border-admin-border bg-admin-deep">
        <div role="toolbar" aria-label="Add content block" className="flex flex-wrap gap-1 border-b border-admin-border p-2">
          {BLOCK_TYPES.map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              disabled={ctx.readOnly}
              onClick={() => onChange([...blocks, newBlock(type, serial + 1)])}
              className={buttonClass.ghost}
            >
              <Icon aria-hidden className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <p className="border-b border-admin-border px-3 py-2 text-xs text-admin-muted">
          Structured blocks only. Raw HTML, scripts and embeds are not accepted.
        </p>
        {blocks.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-admin-muted">No content yet. Add a block to start writing.</p>
        ) : (
          <ol className="divide-y divide-admin-border">
            {blocks.map((block, i) => {
              const meta = BLOCK_TYPES.find((b) => b.type === block.type) ?? BLOCK_TYPES[0];
              const label = `${meta.label} block ${i + 1}`;
              return (
                <li key={block.id} className="p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-admin-muted">
                      <meta.icon aria-hidden className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                    {!ctx.readOnly && (
                      <span className="flex items-center gap-1">
                        <IconButton label={`Move ${label} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Move ${label} down`} disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Remove ${label}`} onClick={() => setRemoving(i)}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </span>
                    )}
                  </div>
                  {block.type === 'heading' ? (
                    <div className="flex gap-2">
                      <select
                        aria-label={`${label} level`}
                        value={String(block.level ?? 2)}
                        disabled={ctx.readOnly}
                        onChange={(e) => update(i, { level: Number(e.target.value) })}
                        className={`${inputClass} w-24`}
                      >
                        <option value="2">H2</option>
                        <option value="3">H3</option>
                      </select>
                      <input aria-label={`${label} text`} value={String(block.text ?? '')} disabled={ctx.readOnly} onChange={(e) => update(i, { text: e.target.value })} className={`${inputClass} font-semibold`} />
                    </div>
                  ) : block.type === 'image' ? (
                    <BlockImage block={block} label={label} ctx={ctx} onChange={(image) => update(i, { image })} />
                  ) : block.type === 'quote' ? (
                    <div className="space-y-2">
                      <textarea aria-label={`${label} text`} rows={2} value={String(block.text ?? '')} disabled={ctx.readOnly} onChange={(e) => update(i, { text: e.target.value })} className={`${inputClass} italic`} />
                      <input
                        aria-label={`${label} attribution`}
                        placeholder="Attribution (optional)"
                        value={String(block.attribution ?? '')}
                        disabled={ctx.readOnly}
                        onChange={(e) => update(i, { attribution: e.target.value || null })}
                        className={inputClass}
                      />
                    </div>
                  ) : block.type === 'list' ? (
                    <div className="space-y-2">
                      <select aria-label={`${label} style`} value={String(block.style ?? 'bullet')} disabled={ctx.readOnly} onChange={(e) => update(i, { style: e.target.value })} className={`${inputClass} w-40`}>
                        <option value="bullet">Bulleted</option>
                        <option value="numbered">Numbered</option>
                      </select>
                      <textarea
                        aria-label={`${label} items, one per line`}
                        rows={3}
                        value={Array.isArray(block.items) ? block.items.join('\n') : ''}
                        disabled={ctx.readOnly}
                        onChange={(e) => update(i, { items: e.target.value.split('\n') })}
                        placeholder="One item per line"
                        className={inputClass}
                      />
                    </div>
                  ) : (
                    <textarea aria-label={`${label} text`} rows={3} value={String(block.text ?? '')} disabled={ctx.readOnly} onChange={(e) => update(i, { text: e.target.value })} className={inputClass} />
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
      <ConfirmDialog
        open={removing !== null}
        title="Remove block?"
        consequence="The block and its content will be removed when you save."
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing !== null) onChange(blocks.filter((_, j) => j !== removing));
          setRemoving(null);
        }}
      />
    </Shell>
  );
}

function BlockImage({ block, label, ctx, onChange }: { block: Block; label: string; ctx: FieldContext; onChange: (image: Json) => void }) {
  const [open, setOpen] = useState(false);
  const image = (isRecord(block.image) ? block.image : { src: '', alt: '', caption: '' }) as { src: string; alt: string; caption?: string };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {image.src ? (
          <span className="relative block h-16 w-24 shrink-0 overflow-hidden rounded-[6px] border border-admin-border">
            <Image src={image.src} alt="" fill sizes="96px" className="object-cover" />
          </span>
        ) : (
          <span className="grid h-16 w-24 shrink-0 place-items-center rounded-[6px] border border-dashed border-admin-border text-admin-muted">
            <ImageIcon aria-hidden className="h-5 w-5" />
          </span>
        )}
        {!ctx.readOnly && (
          <button type="button" onClick={() => setOpen(true)} className={buttonClass.secondary}>
            {image.src ? 'Replace image' : 'Choose image'}
          </button>
        )}
      </div>
      <input aria-label={`${label} alt text`} placeholder="Alt text" value={image.alt} disabled={ctx.readOnly} onChange={(e) => onChange({ ...image, alt: e.target.value })} className={inputClass} />
      <input aria-label={`${label} caption`} placeholder="Caption (optional)" value={image.caption ?? ''} disabled={ctx.readOnly} onChange={(e) => onChange({ ...image, caption: e.target.value })} className={inputClass} />
      <MediaPicker
        open={open}
        onClose={() => setOpen(false)}
        media={ctx.media}
        onPick={(m) => {
          onChange({ ...image, src: m.src, alt: image.alt || m.alt });
          setOpen(false);
        }}
      />
    </div>
  );
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-[6px] text-admin-muted hover:bg-white/5 hover:text-white disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Repeater
// ---------------------------------------------------------------------------

function blankRow(fields: FieldConfig[]): Json {
  let row: Json = {};
  for (const sub of fields) {
    const empty =
      sub.type === 'toggle' ? false : sub.type === 'tags' || sub.type === 'multiselect' || sub.type === 'repeater' ? [] : sub.type === 'media' || sub.type === 'money' || sub.type === 'number' ? null : '';
    row = setPath(row, sub.key, empty);
  }
  return row;
}

function RepeaterField({ id, field, value, onChange, ctx, error, path }: FieldProps) {
  const rows = (Array.isArray(value) ? value : []) as Json[];
  const fields = field.itemFields ?? [];
  const noun = field.itemNoun ?? 'Item';
  const [dragging, setDragging] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    onChange(next);
  };

  return (
    <Shell id={id} field={field} error={error} asGroup extra={<span className="text-xs text-admin-muted">{rows.length}</span>}>
      <div className="space-y-2">
        {rows.length === 0 && <p className="rounded-[10px] border border-dashed border-admin-border px-3 py-5 text-center text-sm text-admin-muted">No {noun.toLowerCase()}s yet.</p>}
        {rows.map((row, i) => {
          const title = field.itemLabelKey ? textValue(getPath(row, field.itemLabelKey)) : '';
          const label = `${noun} ${i + 1}${title ? `: ${title}` : ''}`;
          return (
            <div
              key={String(row.id ?? row.key ?? i)}
              onDragOver={(e) => {
                if (dragging === null) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragging !== null) move(dragging, i);
                setDragging(null);
              }}
              className={`rounded-[10px] border bg-admin-deep/70 ${dragging === i ? 'border-rave-red/70 opacity-60' : 'border-admin-border'}`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-admin-border px-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  {!ctx.readOnly && (
                    <span
                      draggable
                      onDragStart={() => setDragging(i)}
                      onDragEnd={() => setDragging(null)}
                      aria-hidden
                      className="cursor-grab text-admin-muted active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                  )}
                  <span className="truncate text-sm font-medium text-white">{label}</span>
                </span>
                {!ctx.readOnly && (
                  <span className="flex shrink-0 items-center gap-1">
                    <IconButton label={`Move ${label} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={`Move ${label} down`} disabled={i === rows.length - 1} onClick={() => move(i, i + 1)}>
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                    <IconButton label={`Remove ${label}`} onClick={() => setRemoving(i)}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2">
                {fields.map((sub) =>
                  isVisible(sub, row) ? (
                    <div key={sub.key} className={widthClass(sub)}>
                      <FieldInput
                        field={sub}
                        path={`${path}.${i}.${sub.key}`}
                        value={getPath(row, sub.key)}
                        values={row}
                        ctx={ctx}
                        onChange={(v) => onChange(rows.map((r, j) => (j === i ? setPath(r, sub.key, v) : r)))}
                      />
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          );
        })}
        {!ctx.readOnly && (
          <button type="button" onClick={() => onChange([...rows, blankRow(fields)])} className={buttonClass.secondary}>
            <Plus aria-hidden className="h-4 w-4" /> Add {noun.toLowerCase()}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={removing !== null}
        title={`Remove ${noun.toLowerCase()}?`}
        consequence="It will be removed when you save."
        confirmLabel="Remove"
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing !== null) onChange(rows.filter((_, j) => j !== removing));
          setRemoving(null);
        }}
      />
    </Shell>
  );
}

function textValue(v: unknown): string {
  if (typeof v === 'string') return v;
  if (isRecord(v)) return String(v.en ?? '');
  return '';
}

export function widthClass(field: FieldConfig): string {
  const full = ['textarea', 'localizedTextarea', 'blocks', 'repeater', 'tags', 'multiselect', 'permissions', 'mediaList'];
  if (field.width === 'half' && !full.includes(field.type)) return 'sm:col-span-1';
  return 'sm:col-span-2';
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

interface FieldProps {
  id: string;
  field: FieldConfig;
  value: unknown;
  values: unknown;
  path: string;
  onChange: (value: unknown) => void;
  ctx: FieldContext;
  error?: string;
}

export default function FieldInput({
  field,
  path,
  value,
  values,
  onChange,
  ctx,
  onSlugEdited,
}: {
  field: FieldConfig;
  path: string;
  value: unknown;
  values: unknown;
  onChange: (value: unknown) => void;
  ctx: FieldContext;
  onSlugEdited?: () => void;
}) {
  const id = `f-${useId().replace(/:/g, '')}`;
  const error = ctx.errors[path];
  const props: FieldProps = { id, field, value, values, path, onChange, ctx, error };
  const aria = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy(id, field, error), 'aria-required': field.required || undefined };
  const options = field.options ?? (field.optionSource ? ctx.optionSets[field.optionSource] ?? [] : []);

  switch (field.type) {
    case 'textarea':
    case 'localizedTextarea':
    case 'localizedText': {
      const localized = field.type !== 'textarea';
      const current = localized ? (isRecord(value) ? String(value[ctx.language] ?? '') : '') : String(value ?? '');
      const set = (text: string) => onChange(localized ? { ...(isRecord(value) ? value : {}), [ctx.language]: text } : text);
      const missingVi = localized && ctx.language === 'vi' && !current;
      const extra = localized ? (
        <span className={`rounded border px-1.5 text-[10px] uppercase tracking-wider ${missingVi ? 'border-admin-warning/40 text-admin-warning' : 'border-white/15 text-admin-muted'}`}>
          {ctx.language}
          {missingVi ? ' missing' : ''}
        </span>
      ) : null;
      const counter = field.maxLength ? `${current.length}/${field.maxLength}` : undefined;
      // Only English is required; Vietnamese may be left for translation.
      const shownField = localized && ctx.language === 'vi' ? { ...field, required: false } : field;
      return (
        <Shell id={id} field={shownField} error={ctx.language === 'en' || !localized ? error : undefined} counter={counter} extra={extra}>
          {field.type === 'localizedText' ? (
            <input {...aria} value={current} placeholder={field.placeholder} disabled={ctx.readOnly} onChange={(e) => set(e.target.value)} className={inputClass} lang={ctx.language} />
          ) : (
            <textarea {...aria} rows={4} value={current} placeholder={field.placeholder} disabled={ctx.readOnly} onChange={(e) => set(e.target.value)} className={inputClass} lang={localized ? ctx.language : undefined} />
          )}
        </Shell>
      );
    }
    case 'slug': {
      const source = field.slugFrom ? textValue(getPath(values, field.slugFrom)) : '';
      return (
        <Shell
          id={id}
          field={field}
          error={error}
          extra={
            !ctx.readOnly && source ? (
              <button type="button" onClick={() => onChange(slugify(source))} className="text-xs text-rave-red hover:underline focus:outline-none focus-visible:underline">
                Generate
              </button>
            ) : null
          }
        >
          <div className="flex items-center rounded-[8px] border border-admin-border bg-admin-deep focus-within:border-rave-red">
            <span className="pl-3 text-sm text-admin-muted">/</span>
            <input
              {...aria}
              value={String(value ?? '')}
              disabled={ctx.readOnly}
              onChange={(e) => {
                onSlugEdited?.();
                onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              spellCheck={false}
              className="min-h-[42px] w-full bg-transparent px-1.5 text-sm text-white focus:outline-none"
            />
          </div>
        </Shell>
      );
    }
    case 'number':
      return (
        <Shell id={id} field={field} error={error}>
          <input
            {...aria}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            value={value === null || value === undefined ? '' : String(value)}
            disabled={ctx.readOnly}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            className={inputClass}
          />
        </Shell>
      );
    case 'money': {
      const money = isRecord(value) ? (value as { amountMinor?: number; currency?: string }) : null;
      return (
        <Shell id={id} field={field} error={error}>
          <div className="flex items-center rounded-[8px] border border-admin-border bg-admin-deep focus-within:border-rave-red">
            <span className="pl-3 text-sm text-admin-muted">$</span>
            <input
              {...aria}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={field.min}
              value={money && typeof money.amountMinor === 'number' ? String(money.amountMinor / 100) : ''}
              disabled={ctx.readOnly}
              onChange={(e) =>
                onChange(e.target.value === '' ? null : { amountMinor: Math.round(Number(e.target.value) * 100), currency: money?.currency ?? 'AUD' })
              }
              className="min-h-[42px] w-full bg-transparent px-1.5 text-sm text-white focus:outline-none"
            />
            <span className="pr-3 text-xs text-admin-muted">{money?.currency ?? 'AUD'}</span>
          </div>
        </Shell>
      );
    }
    case 'select':
      return (
        <Shell id={id} field={field} error={error}>
          <select {...aria} value={value === undefined || value === null ? '' : String(value)} disabled={ctx.readOnly} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            {(!field.required || !value) && <option value="">{field.required ? 'Select…' : 'None'}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Shell>
      );
    case 'multiselect':
      return <MultiSelectField {...props} options={options} />;
    case 'toggle':
      return (
        <div data-field={field.key} className="flex min-h-[42px] items-center justify-between gap-3 rounded-[8px] border border-admin-border bg-admin-deep px-3 sm:mt-[26px]">
          <label htmlFor={id} className="text-sm text-white/90">
            {field.label}
          </label>
          <button
            id={id}
            type="button"
            role="switch"
            aria-checked={value === true}
            disabled={ctx.readOnly}
            onClick={() => onChange(value !== true)}
            aria-describedby={field.help ? `${id}-help` : undefined}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red disabled:opacity-60 ${value === true ? 'bg-rave-red' : 'bg-white/15'}`}
          >
            <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${value === true ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
          </button>
          {field.help && (
            <span id={`${id}-help`} className="sr-only">
              {field.help}
            </span>
          )}
        </div>
      );
    case 'date':
    case 'time':
    case 'datetime':
      return (
        <Shell id={id} field={field} error={error}>
          <input
            {...aria}
            type={field.type === 'datetime' ? 'datetime-local' : field.type}
            value={String(value ?? '').slice(0, field.type === 'date' ? 10 : 16)}
            disabled={ctx.readOnly}
            onChange={(e) => onChange(e.target.value || null)}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </Shell>
      );
    case 'media':
    case 'mediaList':
      return <MediaField {...props} />;
    case 'tags':
      return <TagsField {...props} />;
    case 'blocks':
      return <BlocksField {...props} />;
    case 'repeater':
      return <RepeaterField {...props} />;
    case 'permissions':
      return <PermissionsField {...props} />;
    case 'secret':
      return (
        <Shell id={id} field={field} error={error}>
          <input {...aria} type="password" autoComplete="new-password" value={String(value ?? '')} disabled={ctx.readOnly} onChange={(e) => onChange(e.target.value)} placeholder="Enter a new value to replace" className={inputClass} />
        </Shell>
      );
    case 'readonly': {
      const shown = options.find((o) => o.value === value)?.label ?? textValue(value) ?? '';
      return (
        <Shell id={id} field={field}>
          <p id={id} className="flex min-h-[42px] items-center rounded-[8px] border border-admin-border/60 bg-white/[0.02] px-3 text-sm text-white/80">
            {shown || '—'}
          </p>
        </Shell>
      );
    }
    default:
      return (
        <Shell id={id} field={field} error={error} counter={field.maxLength ? `${String(value ?? '').length}/${field.maxLength}` : undefined}>
          <input
            {...aria}
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            inputMode={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : undefined}
            value={String(value ?? '')}
            placeholder={field.placeholder}
            disabled={ctx.readOnly}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </Shell>
      );
  }
}
