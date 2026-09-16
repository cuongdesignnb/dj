'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { deleteRecords, saveRecord } from '@/app/admin/actions';
import type { Option } from '@/lib/admin/common/schema';
import { inputClass } from '../form/FieldInput';
import { ConfirmDialog, Drawer, buttonClass } from '../ui/Dialog';
import { EmptyState } from '../ui/States';
import StatusBadge from '../ui/StatusBadge';
import { useToast } from '../ui/Toast';

export interface FaqItem {
  id: string;
  category: string;
  question: { en?: string; vi?: string };
  answer: { en?: string; vi?: string };
  keywords: string[];
  published: boolean;
  sortOrder: number;
}

type Draft = Omit<FaqItem, 'id'> & { id: string | null };

const blank = (category: string, sortOrder: number): Draft => ({
  id: null,
  category,
  question: { en: '', vi: '' },
  answer: { en: '', vi: '' },
  keywords: [],
  published: false,
  sortOrder,
});

/** Category rail, ordered question list, and a drawer editor. */
export default function FaqManager({
  items,
  categories,
  active,
  canCreate,
  canEdit,
  canDelete,
}: {
  items: FaqItem[];
  categories: Option[];
  active: string;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [lang, setLang] = useState<'en' | 'vi'>('en');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<FaqItem | null>(null);
  const [keywordText, setKeywordText] = useState('');

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const item of items) out[item.category] = (out[item.category] ?? 0) + 1;
    return out;
  }, [items]);

  const needle = search.trim().toLowerCase();
  const list = items
    .filter((i) => i.category === active)
    .filter((i) => !needle || `${i.question.en ?? ''} ${i.answer.en ?? ''} ${i.keywords.join(' ')}`.toLowerCase().includes(needle))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const activeLabel = categories.find((c) => c.value === active)?.label ?? active;

  const refresh = () => start(() => router.refresh());

  const persist = async (id: string | null, values: Record<string, unknown>) => {
    const result = await saveRecord('faq', id, values);
    if (!result.ok) toast('error', result.error.message);
    return result;
  };

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    const { id, ...values } = draft;
    const keywords = keywordText.split(',').map((k) => k.trim()).filter(Boolean);
    const result = await persist(id, { ...values, keywords });
    setBusy(false);
    if (result.ok) {
      toast('success', result.message ?? 'Saved.');
      setDraft(null);
      setErrors({});
      refresh();
    } else {
      setErrors(result.error.fieldErrors ?? {});
      setLang('en');
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const a = list[index];
    const b = list[index + dir];
    if (!a || !b) return;
    // Swap positions; equal numbers get spread apart so the order is stable.
    const aOrder = b.sortOrder === a.sortOrder ? a.sortOrder + dir : b.sortOrder;
    const r1 = await persist(a.id, { ...a, sortOrder: aOrder });
    const r2 = r1.ok ? await persist(b.id, { ...b, sortOrder: a.sortOrder }) : r1;
    if (r2.ok) {
      toast('success', 'Order updated.');
      refresh();
    }
  };

  const togglePublished = async (item: FaqItem) => {
    const result = await persist(item.id, { ...item, published: !item.published });
    if (result.ok) {
      toast('success', item.published ? 'Hidden from the FAQ page.' : 'Shown on the FAQ page.');
      refresh();
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    const result = await deleteRecords('faq', [deleting.id]);
    setBusy(false);
    if (result.ok) {
      toast('success', result.message ?? 'Deleted.');
      setDeleting(null);
      refresh();
    } else {
      toast('error', result.error.message);
    }
  };

  const nextOrder = list.length ? Math.max(...list.map((i) => i.sortOrder)) + 10 : 10;
  const field = (key: string) => errors[key];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="FAQ categories" className="rounded-[12px] border border-admin-border bg-admin-panel/90 p-2 lg:self-start">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col">
          {categories.map((c) => {
            const current = c.value === active;
            return (
              <li key={c.value} className="shrink-0">
                <Link
                  href={`/admin/content/faq?category=${c.value}`}
                  replace
                  scroll={false}
                  aria-current={current ? 'page' : undefined}
                  className={`flex min-h-[40px] items-center justify-between gap-3 rounded-[8px] px-3 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${
                    current ? 'bg-rave-red/15 text-white shadow-[inset_3px_0_0_#FF173D]' : 'text-admin-muted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {c.label}
                  <span className="text-xs tabular-nums">{counts[c.value] ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-labelledby="faq-list-title" className="rounded-[12px] border border-admin-border bg-admin-panel/90">
        <div className="flex flex-col gap-3 border-b border-admin-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <h2 id="faq-list-title" className="font-heading text-base font-semibold uppercase tracking-[0.08em] text-white">
            {activeLabel}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search questions</span>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className={`${inputClass} min-h-[40px] w-56 pl-9`} />
            </label>
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  setErrors({});
                  setLang('en');
                  setKeywordText('');
                  setDraft(blank(active, nextOrder));
                }}
                className={buttonClass.primary}
              >
                <Plus aria-hidden className="h-4 w-4" /> Add question
              </button>
            )}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="p-4">
            <EmptyState title={needle ? 'No matching questions.' : 'No questions in this category.'} />
          </div>
        ) : (
          <ol className="divide-y divide-admin-border">
            {list.map((item, index) => (
              <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{item.question.en || 'Untitled question'}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-admin-muted">{item.answer.en}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge value={item.published ? 'published' : 'draft'} label={item.published ? 'Published' : 'Hidden'} />
                    {!item.question.vi && <StatusBadge value="missing" label="VI missing" />}
                  </p>
                </div>
                {canEdit && (
                  <div className="flex shrink-0 flex-wrap items-center gap-1">
                    <label className="mr-2 inline-flex items-center gap-2 text-xs text-admin-muted">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.published}
                        aria-label={`Published: ${item.question.en}`}
                        onClick={() => togglePublished(item)}
                        className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${item.published ? 'bg-rave-red' : 'bg-white/15'}`}
                      >
                        <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white transition-transform motion-reduce:transition-none ${item.published ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                      Live
                    </label>
                    <button type="button" aria-label={`Move up: ${item.question.en}`} disabled={index === 0 || !!needle} onClick={() => move(index, -1)} className={`${buttonClass.ghost} px-2`}>
                      <ArrowUp aria-hidden className="h-4 w-4" />
                    </button>
                    <button type="button" aria-label={`Move down: ${item.question.en}`} disabled={index === list.length - 1 || !!needle} onClick={() => move(index, 1)} className={`${buttonClass.ghost} px-2`}>
                      <ArrowDown aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setLang('en');
                        setKeywordText(item.keywords.join(', '));
                        setDraft({ ...item, question: { ...item.question }, answer: { ...item.answer } });
                      }}
                      className={buttonClass.secondary}
                    >
                      <Pencil aria-hidden className="h-4 w-4" /> Edit
                    </button>
                    {canDelete && (
                      <button type="button" aria-label={`Delete: ${item.question.en}`} onClick={() => setDeleting(item)} className={`${buttonClass.ghost} px-2 text-[#FF6B82]`}>
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <Drawer
        open={!!draft}
        onClose={() => !busy && setDraft(null)}
        title={draft?.id ? 'Edit question' : 'Add question'}
        footer={
          <>
            <button type="button" onClick={() => setDraft(null)} disabled={busy} className={buttonClass.secondary}>
              Cancel
            </button>
            <button type="button" onClick={save} disabled={busy} className={buttonClass.primary}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        {draft && (
          <div className="space-y-4">
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="rounded-[8px] border border-rave-red/40 bg-rave-red/[0.06] px-3 py-2 text-sm text-[#FF8A9C]">
                {Object.values(errors).join(' ')}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">Category</span>
              <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass}>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <div role="group" aria-label="Language" className="inline-flex rounded-[8px] border border-admin-border p-0.5">
              {(['en', 'vi'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={`min-h-[34px] rounded-[6px] px-3 text-xs font-semibold uppercase tracking-wider focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red ${lang === l ? 'bg-white/10 text-white' : 'text-admin-muted hover:text-white'}`}
                >
                  {l === 'en' ? 'English' : 'Tiếng Việt'}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">
                Question{lang === 'en' && <span className="ml-0.5 text-rave-red" aria-hidden>*</span>}
              </span>
              <input
                lang={lang}
                value={draft.question[lang] ?? ''}
                maxLength={160}
                aria-invalid={lang === 'en' && field('question') ? true : undefined}
                onChange={(e) => setDraft({ ...draft, question: { ...draft.question, [lang]: e.target.value } })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">
                Answer{lang === 'en' && <span className="ml-0.5 text-rave-red" aria-hidden>*</span>}
              </span>
              <textarea
                lang={lang}
                rows={6}
                value={draft.answer[lang] ?? ''}
                aria-invalid={lang === 'en' && field('answer') ? true : undefined}
                onChange={(e) => setDraft({ ...draft, answer: { ...draft.answer, [lang]: e.target.value } })}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-admin-muted">Plain text. State only confirmed information.</span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/90">Search keywords</span>
              <input
                value={keywordText}
                onChange={(e) => setKeywordText(e.target.value)}
                placeholder="Comma separated"
                className={inputClass}
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-white">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} className="h-4 w-4 accent-[#FF173D]" />
              Show on the FAQ page
            </label>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!deleting}
        busy={busy}
        title="Delete this question?"
        entity={deleting?.question.en}
        consequence="It will be removed from the FAQ page. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={remove}
      />
    </div>
  );
}
