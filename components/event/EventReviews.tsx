'use client';

import { useState, type FormEvent } from 'react';
import { CheckCircle2, Star } from 'lucide-react';
import Container from '@/components/ui/Container';
import EventSectionHeading from './EventSectionHeading';
import type { EventPageData } from '@/lib/events/types';

const DATE = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' });

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} aria-hidden className={`${size} ${index < Math.round(value) ? 'fill-amber-300 text-amber-300' : 'text-white/20'}`} />
      ))}
    </span>
  );
}

const field = 'w-full rounded-xl border border-white/[0.12] bg-rave-black/60 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-rave-red focus:outline-none';

/**
 * Reviews of Connection events. Approved reviews only (moderated in Admin › Reviews);
 * anyone can send one, and it stays private until an editor approves it.
 */
export default function EventReviews({ event }: { event: EventPageData }) {
  const reviews = event.event.reviews ?? { summary: { count: 0, average: null }, items: [] };
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const next: Record<string, string> = {};
    const authorName = String(form.get('authorName') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const comment = String(form.get('comment') ?? '').trim();
    if (rating < 1) next.rating = 'Choose a star rating.';
    if (authorName.length < 2) next.authorName = 'Enter your name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email.';
    if (comment.length < 10) next.comment = 'Write at least 10 characters.';
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;
    setState('sending');
    try {
      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ eventSlug: event.event.slug, authorName, email, rating, comment, website: String(form.get('website') ?? '') }),
      });
      if (response.ok) { setState('sent'); return; }
      const payload = await response.json().catch(() => null);
      const fieldErrors = payload?.error?.details ?? payload?.error?.fieldErrors;
      if (fieldErrors && typeof fieldErrors === 'object') setErrors(fieldErrors as Record<string, string>);
      setFormError(response.status === 429 ? 'You have sent a few reviews already. Please try again later.' : 'Your review could not be sent. Please check the form and try again.');
      setState('idle');
    } catch {
      setFormError('Your review could not be sent. Please check your connection and try again.');
      setState('idle');
    }
  };

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative py-16 md:py-24 bg-rave-black">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <EventSectionHeading eyebrow="Reviews" title="What People Say" id="reviews-title" align="left" />
          <div data-review-summary="" className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-rave-panel/60 px-5 py-4">
            <span className="font-heading text-4xl font-black text-white">{reviews.summary.average?.toFixed(1) ?? '–'}</span>
            <span className="flex flex-col gap-1">
              <Stars value={reviews.summary.average ?? 0} />
              <span className="text-xs text-rave-muted">
                {reviews.summary.count === 0 ? 'No reviews yet' : `${reviews.summary.count} review${reviews.summary.count === 1 ? '' : 's'} of Connection events`}
              </span>
            </span>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            {reviews.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/[0.14] p-8 text-center">
                <p className="font-heading text-lg uppercase tracking-wide text-white">Be the first to leave a review</p>
                <p className="mt-2 text-sm text-rave-muted">Been to a Connection night? Tell others what it was like.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {reviews.items.map((review) => (
                  <li key={review.id} className="rounded-2xl border border-white/[0.08] bg-rave-panel/60 p-5">
                    <Stars value={review.rating} />
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">{review.comment}</p>
                    <p className="mt-4 text-xs text-rave-muted">
                      <span className="font-semibold text-white">{review.authorName}</span>
                      {review.event ? ` · ${review.event.title}` : ''}
                      {review.createdAt ? ` · ${DATE.format(new Date(review.createdAt))}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-5">
            {state === 'sent' ? (
              <div role="status" data-review-sent="" className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-rave-red/40 bg-rave-panel/70 p-8 text-center">
                <CheckCircle2 aria-hidden className="h-10 w-10 text-rave-red" />
                <p className="font-heading text-lg uppercase tracking-wide text-white">Thanks for your review</p>
                <p className="text-sm text-rave-muted">It will appear here once the team has checked it.</p>
              </div>
            ) : (
              <form noValidate onSubmit={(formEvent) => void submit(formEvent)} data-review-form="" className="rounded-2xl border border-white/[0.10] bg-rave-panel/70 p-6">
                <h3 className="font-heading text-lg font-bold uppercase tracking-wide text-white">Write a review</h3>
                <p className="mt-1 text-xs text-rave-muted">Your email is never shown. Reviews appear after a quick check.</p>

                <fieldset className="mt-5">
                  <legend className="mb-2 text-sm text-white">Your rating</legend>
                  <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                        aria-pressed={rating === value}
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHover(value)}
                        className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rave-red"
                      >
                        <Star aria-hidden className={`h-7 w-7 ${(hover || rating) >= value ? 'fill-amber-300 text-amber-300' : 'text-white/25'}`} />
                      </button>
                    ))}
                  </div>
                  {errors.rating && <p className="mt-1 text-xs text-rose-300">{errors.rating}</p>}
                </fieldset>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-white">Name</span>
                    <input name="authorName" maxLength={80} autoComplete="name" className={field} aria-invalid={Boolean(errors.authorName)} />
                    {errors.authorName && <span className="mt-1 block text-xs text-rose-300">{errors.authorName}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm text-white">Email</span>
                    <input name="email" type="email" maxLength={320} autoComplete="email" className={field} aria-invalid={Boolean(errors.email)} />
                    {errors.email && <span className="mt-1 block text-xs text-rose-300">{errors.email}</span>}
                  </label>
                </div>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-sm text-white">Your review</span>
                  <textarea name="comment" rows={4} maxLength={2000} className={field} aria-invalid={Boolean(errors.comment)} placeholder="The music, the crowd, the night…" />
                  {errors.comment && <span className="mt-1 block text-xs text-rose-300">{errors.comment}</span>}
                </label>
                {/* Honeypot: hidden from people, filled by bots. */}
                <label aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
                  Website <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
                {formError && <p role="alert" className="mt-4 text-sm text-rose-300">{formError}</p>}
                <button type="submit" disabled={state === 'sending'} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gradient-to-r from-rave-red to-rave-red2 px-6 font-heading text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:brightness-110 disabled:opacity-60">
                  {state === 'sending' ? 'Sending…' : 'Send review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
