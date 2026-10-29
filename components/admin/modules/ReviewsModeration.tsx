'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Star, Trash2 } from 'lucide-react';
import { useToast } from '@/components/admin/ui/Toast';
import { normalizeApiError } from '@/lib/api/client';

export interface AdminReview {
  id: string;
  authorName: string;
  email: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
  approvedAt: string | null;
  event: { slug: string; title: string } | null;
}

const TABS = [
  { key: 'PENDING', label: 'Waiting for approval' },
  { key: 'APPROVED', label: 'Shown on site' },
  { key: 'HIDDEN', label: 'Hidden' },
] as const;

const STATUS_STYLE: Record<AdminReview['status'], string> = {
  PENDING: 'border-amber-300/40 bg-amber-300/10 text-amber-100',
  APPROVED: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  HIDDEN: 'border-admin-border bg-white/5 text-admin-muted',
};

const DATE = new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export default function ReviewsModeration({ initial, canEdit }: { initial: AdminReview[]; canEdit: boolean }) {
  const toast = useToast();
  const [reviews, setReviews] = useState(initial);
  const [tab, setTab] = useState<AdminReview['status']>(
    initial.length === 0 || initial.some((review) => review.status === 'PENDING') ? 'PENDING' : 'APPROVED',
  );
  const [csrf, setCsrf] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/auth/session', { credentials: 'include' })
      .then((response) => response.json())
      .then((payload) => setCsrf(payload?.data?.csrfToken ?? null))
      .catch(() => setCsrf(null));
  }, []);

  const counts = useMemo(
    () => Object.fromEntries(TABS.map(({ key }) => [key, reviews.filter((review) => review.status === key).length])),
    [reviews],
  );
  const shown = reviews.filter((review) => review.status === tab);

  const act = async (review: AdminReview, action: 'APPROVED' | 'HIDDEN' | 'DELETE') => {
    if (action === 'DELETE' && !window.confirm(`Delete the review from ${review.authorName}? This cannot be undone.`)) return;
    setBusy(review.id);
    try {
      const response = await fetch(`/api/v1/admin/reviews/${review.id}`, {
        method: action === 'DELETE' ? 'DELETE' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: action === 'DELETE' ? undefined : JSON.stringify({ status: action }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        toast('error', normalizeApiError(response.status, payload).message);
        return;
      }
      setReviews((current) =>
        action === 'DELETE'
          ? current.filter((item) => item.id !== review.id)
          : current.map((item) => (item.id === review.id ? { ...item, status: action } : item)),
      );
      toast('success', action === 'APPROVED' ? 'Review is now shown on the website.' : action === 'HIDDEN' ? 'Review hidden from the website.' : 'Review deleted.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <div role="tablist" aria-label="Review status" className="flex flex-wrap gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm ${tab === key ? 'border-rave-red bg-rave-red/15 text-white' : 'border-admin-border text-admin-muted hover:text-white'}`}
          >
            {label} <span className="rounded-full bg-white/10 px-2 text-xs">{counts[key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-6 text-sm text-admin-muted">
          {tab === 'PENDING' ? 'No reviews are waiting. New reviews from the event pages appear here.' : 'Nothing here yet.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((review) => (
            <li key={review.id} data-review-row={review.id} className="rounded-[12px] border border-admin-border bg-admin-panel/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">
                    {review.authorName} <span className="text-xs font-normal text-admin-muted">· {review.email}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-admin-muted">
                    {DATE.format(new Date(review.createdAt))}
                    {review.event ? ` · ${review.event.title}` : ' · General'}
                  </p>
                  <p className="mt-2 flex items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} aria-hidden className={`h-4 w-4 ${index < review.rating ? 'fill-amber-300 text-amber-300' : 'text-admin-border'}`} />
                    ))}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs ${STATUS_STYLE[review.status]}`}>
                  {TABS.find((item) => item.key === review.status)?.label}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">{review.comment}</p>
              {canEdit && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {review.status !== 'APPROVED' && (
                    <button type="button" disabled={busy === review.id} onClick={() => void act(review, 'APPROVED')} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] bg-rave-red px-3 text-sm font-semibold text-white">
                      <Check aria-hidden className="h-4 w-4" /> Approve
                    </button>
                  )}
                  {review.status !== 'HIDDEN' && (
                    <button type="button" disabled={busy === review.id} onClick={() => void act(review, 'HIDDEN')} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-admin-border px-3 text-sm text-white">
                      <EyeOff aria-hidden className="h-4 w-4" /> Hide
                    </button>
                  )}
                  <button type="button" disabled={busy === review.id} onClick={() => void act(review, 'DELETE')} className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[8px] border border-rose-400/40 px-3 text-sm text-rose-200">
                    <Trash2 aria-hidden className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
