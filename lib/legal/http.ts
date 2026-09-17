import type { LegalDocument, LegalDocumentStatus, LegalDocumentType, LegalSection } from './types';

// Normalizes legal documents from an API. A document without sections is
// treated as unavailable; there is never a fallback to local wording.

const STATUSES: LegalDocumentStatus[] = ['draft', 'review', 'published'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function date(value: unknown): string | null {
  const s = str(value);
  return s && !Number.isNaN(Date.parse(s)) ? s : null;
}

function section(raw: unknown, index: number): LegalSection | null {
  if (!isRecord(raw)) return null;
  const title = str(raw.title);
  const paragraphs = Array.isArray(raw.paragraphs)
    ? raw.paragraphs.map(str).filter(Boolean)
    : [];
  if (!title || paragraphs.length === 0) return null;
  const id = str(raw.id).toLowerCase().replace(/[^a-z0-9-]/g, '') || `section-${index + 1}`;
  return {
    id,
    navLabel: str(raw.navLabel) || title,
    title,
    paragraphs,
    notice: str(raw.notice) || null,
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : index,
  };
}

export function normalizeLegalDocument(
  raw: unknown,
  type: LegalDocumentType,
  fallbackCta: LegalDocument['finalCta'],
): LegalDocument | null {
  const doc = isRecord(raw) && isRecord(raw.document) ? raw.document : raw;
  if (!isRecord(doc)) return null;

  const title = str(doc.title);
  const sections = (Array.isArray(doc.sections) ? doc.sections : [])
    .map(section)
    .filter((s): s is LegalSection => s !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  if (!title || sections.length === 0) return null;

  return {
    type,
    // Anything the source does not clearly mark as published is a draft.
    status: STATUSES.find((s) => s === doc.status) ?? 'draft',
    eyebrow: str(doc.eyebrow) || 'Legal',
    title,
    intro: str(doc.intro),
    version: str(doc.version) || null,
    effectiveDate: date(doc.effectiveDate),
    updatedAt: date(doc.updatedAt),
    sections,
    seoTitle: str(doc.seoTitle) || null,
    seoDescription: str(doc.seoDescription) || null,
    canonicalOverride: str(doc.canonicalOverride) || null,
    indexable: doc.indexable !== false,
    followLinks: doc.followLinks !== false,
    finalCta: fallbackCta,
  };
}
