import 'server-only';

import { z } from 'zod';
import { db } from '@/server/db/client';
import { notFound } from '@/server/errors';

export const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'HIDDEN'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const reviewSubmissionSchema = z.object({
  eventSlug: z.string().trim().max(120).optional().nullable(),
  authorName: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(320),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
  /** Honeypot: people never see this field, bots fill it. */
  website: z.string().max(200).optional(),
}).strict();

export const reviewModerationSchema = z.object({ status: z.enum(REVIEW_STATUSES) }).strict();

const eventTitle = { select: { slug: true, translations: { select: { locale: true, title: true } } } } as const;

function titleOf(event: { slug: string; translations: Array<{ locale: string; title: string }> } | null) {
  if (!event) return null;
  return { slug: event.slug, title: event.translations.find((row) => row.locale === 'en')?.title ?? event.translations[0]?.title ?? event.slug };
}

/** Approved reviews across every Connection event, newest first, with the overall rating. */
export async function getPublicReviews(limit = 12) {
  const where = { status: 'APPROVED' };
  const [rows, aggregate] = await Promise.all([
    db.eventReview.findMany({ where, orderBy: [{ approvedAt: 'desc' }, { createdAt: 'desc' }], take: Math.min(Math.max(limit, 1), 50), include: { event: eventTitle } }),
    db.eventReview.aggregate({ where, _avg: { rating: true }, _count: { _all: true } }),
  ]);
  return {
    summary: { count: aggregate._count._all, average: aggregate._avg.rating ? Math.round(aggregate._avg.rating * 10) / 10 : null },
    reviews: rows.map((row) => ({ id: row.id, authorName: row.authorName, rating: row.rating, comment: row.comment, createdAt: row.createdAt.toISOString(), event: titleOf(row.event) })),
  };
}

/** Stored as pending; nothing is public until an editor approves it. Bots that fill the honeypot are accepted silently and dropped. */
export async function submitReview(input: z.infer<typeof reviewSubmissionSchema>) {
  if (input.website) return { status: 'PENDING' as const };
  const event = input.eventSlug ? await db.event.findFirst({ where: { slug: input.eventSlug, status: 'PUBLISHED', deletedAt: null }, select: { id: true } }) : null;
  await db.eventReview.create({ data: { eventId: event?.id ?? null, authorName: input.authorName, email: input.email, rating: input.rating, comment: input.comment } });
  return { status: 'PENDING' as const };
}

export async function listAdminReviews(status?: string | null) {
  const where = status && (REVIEW_STATUSES as readonly string[]).includes(status) ? { status } : {};
  const rows = await db.eventReview.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500, include: { event: eventTitle } });
  return rows.map((row) => ({ id: row.id, authorName: row.authorName, email: row.email, rating: row.rating, comment: row.comment, status: row.status as ReviewStatus, createdAt: row.createdAt.toISOString(), approvedAt: row.approvedAt?.toISOString() ?? null, event: titleOf(row.event) }));
}

export async function moderateReview(id: string, status: ReviewStatus) {
  const existing = await db.eventReview.findUnique({ where: { id } });
  if (!existing) throw notFound('Review not found.');
  const row = await db.eventReview.update({ where: { id }, data: { status, approvedAt: status === 'APPROVED' ? existing.approvedAt ?? new Date() : existing.approvedAt } });
  return { id: row.id, status: row.status };
}

export async function deleteReview(id: string) {
  const existing = await db.eventReview.findUnique({ where: { id } });
  if (!existing) throw notFound('Review not found.');
  await db.eventReview.delete({ where: { id } });
  return { id, deleted: true };
}
