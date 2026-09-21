'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Image as ImageIcon, LoaderCircle, Search, Upload } from 'lucide-react';
import { Modal, buttonClass } from '../ui/Dialog';

const pickerInputClass = 'w-full min-h-[42px] rounded-[8px] border border-admin-border bg-admin-deep px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-rave-red focus:outline-none focus:ring-1 focus:ring-rave-red/60';

export type MediaPickerFilter = 'image' | 'svg' | 'all';

export interface MediaChoice {
  id?: string | null;
  src: string;
  label: string;
  alt: string;
  kind?: string;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mediaChoiceFrom(value: unknown): MediaChoice | null {
  if (!isRecord(value)) return null;
  const src = typeof value.src === 'string' ? value.src : typeof value.url === 'string' ? value.url : typeof value.publicUrl === 'string' ? value.publicUrl : '';
  if (!src) return null;
  const numeric = (key: string) => typeof value[key] === 'number' ? value[key] as number : null;
  return {
    id: typeof value.id === 'string' ? value.id : typeof value.mediaId === 'string' ? value.mediaId : null,
    src,
    label: typeof value.label === 'string' ? value.label : typeof value.name === 'string' ? value.name : src,
    alt: typeof value.alt === 'string' ? value.alt : typeof value.altText === 'string' ? value.altText : '',
    kind: typeof value.kind === 'string' ? value.kind : undefined,
    mimeType: typeof value.mimeType === 'string' ? value.mimeType : undefined,
    width: numeric('width'),
    height: numeric('height'),
  };
}

function matchesFilter(choice: MediaChoice, filter: MediaPickerFilter) {
  const name = `${choice.label} ${choice.src}`.toLowerCase();
  const mime = choice.mimeType?.toLowerCase() ?? '';
  if (filter === 'svg') return mime === 'image/svg+xml' || name.includes('.svg');
  if (filter === 'image') return mime ? mime.startsWith('image/') : choice.kind !== 'document' && !mime.startsWith('video/') && !name.endsWith('.pdf');
  return true;
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  const payload = await response.json().catch(() => null);
  return isRecord(payload) ? payload : {};
}

async function loadMediaChoices(): Promise<MediaChoice[]> {
  const choices: MediaChoice[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const response = await fetch(`/api/v1/admin/media?page=${page}&pageSize=50`, { credentials: 'include', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('Could not load the media library.');
    const payload = await readJson(response);
    const data = isRecord(payload.data) ? payload.data : {};
    const rows = Array.isArray(data.items) ? data.items : [];
    choices.push(...rows.map(mediaChoiceFrom).filter((value): value is MediaChoice => Boolean(value)));
    const total = typeof data.total === 'number' ? data.total : choices.length;
    if (choices.length >= total || rows.length === 0) break;
  }
  return choices;
}

export async function uploadMediaFile(file: File, altText = ''): Promise<MediaChoice> {
  const sessionResponse = await fetch('/api/v1/auth/session', { credentials: 'include', headers: { accept: 'application/json' } });
  const sessionPayload = await readJson(sessionResponse);
  const sessionData = isRecord(sessionPayload.data) ? sessionPayload.data : {};
  const form = new FormData();
  form.set('file', file);
  form.set('altText', altText.trim());
  const response = await fetch('/api/v1/admin/media/upload', {
    method: 'POST',
    credentials: 'include',
    headers: { accept: 'application/json', 'x-csrf-token': typeof sessionData.csrfToken === 'string' ? sessionData.csrfToken : '' },
    body: form,
  });
  const payload = await readJson(response);
  if (!response.ok) throw new Error(typeof payload.message === 'string' ? payload.message : 'Could not upload this file.');
  const choice = mediaChoiceFrom(payload.data);
  if (!choice) throw new Error('The uploaded file could not be added to the media library.');
  return choice;
}

export function MediaPicker({
  open,
  onClose,
  onPick,
  media = [],
  filter = 'image',
  title = 'Choose from media library',
  description = 'Select an existing asset or upload a new file to the shared library.',
}: {
  open: boolean;
  onClose: () => void;
  onPick: (choice: MediaChoice) => void;
  media?: MediaChoice[];
  filter?: MediaPickerFilter;
  title?: string;
  description?: string;
}) {
  const [query, setQuery] = useState('');
  const [choices, setChoices] = useState<MediaChoice[]>(media);
  const [hasLoaded, setHasLoaded] = useState(media.length > 0);
  const [uploading, setUploading] = useState(false);
  const [uploadAlt, setUploadAlt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadMediaChoices()
      .then((next) => {
        if (!cancelled && (next.length > 0 || media.length === 0)) setChoices(next);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load the media library.');
      })
      .finally(() => {
        if (!cancelled) setHasLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, media]);

  const loading = open && !hasLoaded;
  const handleClose = () => {
    setError(null);
    onClose();
  };
  const shown = choices
    .filter((choice) => matchesFilter(choice, filter))
    .filter((choice) => `${choice.label} ${choice.src}`.toLowerCase().includes(query.trim().toLowerCase()));

  const accept = filter === 'svg' ? '.svg,image/svg+xml' : filter === 'image' ? 'image/*' : 'image/*,video/*,application/pdf';
  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (filter === 'image' && !file.type.startsWith('image/')) {
      setError('This field accepts image files only.');
      return;
    }
    if (filter === 'svg' && !matchesFilter({ src: file.name, label: file.name, alt: '', mimeType: file.type }, 'svg')) {
      setError('This field accepts SVG animation files only.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const choice = await uploadMediaFile(file, uploadAlt);
      setChoices((current) => [choice, ...current.filter((item) => item.id !== choice.id)]);
      setUploadAlt('');
      onPick(choice);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Could not upload this file.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} description={description} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <label>
            <span className="mb-1.5 block text-sm font-medium text-white/90">Search library</span>
            <span className="relative block">
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files..." className={`${pickerInputClass} pl-9`} />
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={(event) => void handleUpload(event.target.files?.[0])} />
            <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className={buttonClass.primary}>
              {uploading ? <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> : <Upload aria-hidden className="h-4 w-4" />}
              {uploading ? 'Uploading…' : 'Upload to library'}
            </button>
          </div>
        </div>
        <label className="block">
          <span className="mb-1.5 block text-xs text-admin-muted">Alt text for a new upload (optional)</span>
          <input value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} placeholder="Describe the image" className={pickerInputClass} />
        </label>
        {filter === 'svg' && <p className="text-xs text-admin-muted">SVG animation files are stored in the same library and can be reused anywhere.</p>}
        {error && <p role="alert" className="rounded-[8px] border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
        {loading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-admin-muted"><LoaderCircle aria-hidden className="h-4 w-4 animate-spin" /> Loading media library…</p>
        ) : shown.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-admin-border px-4 py-10 text-center text-sm text-admin-muted">
            <ImageIcon aria-hidden className="mx-auto h-6 w-6" />
            <p className="mt-2">No matching files.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {shown.map((choice) => (
              <li key={choice.id ?? choice.src}>
                <button type="button" onClick={() => onPick(choice)} className="group block w-full overflow-hidden rounded-[10px] border border-admin-border bg-admin-deep text-left hover:border-rave-red/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red">
                  <span className={`relative block aspect-[4/3] ${choice.kind === 'logo' || choice.mimeType === 'image/svg+xml' ? 'bg-[#15161c]' : ''}`}>
                    <Image src={choice.src} alt="" fill unoptimized sizes="200px" className={choice.kind === 'logo' || choice.mimeType === 'image/svg+xml' ? 'object-contain p-3' : 'object-cover'} />
                  </span>
                  <span className="block truncate px-2 py-1.5 text-xs text-white/85">{choice.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
