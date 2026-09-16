// Legal document model for /terms and /privacy.
//
// Content is plain paragraphs — no HTML path. `status` controls the draft
// badge and indexing; dates only render when the source supplies them.

export type LegalDocumentType = 'terms' | 'privacy';

export type LegalDocumentStatus = 'draft' | 'review' | 'published';

export interface LegalSection {
  id: string;
  navLabel: string;
  title: string;
  paragraphs: string[];
  notice?: string | null;
  sortOrder: number;
}

export interface LinkAction {
  label: string;
  href: string;
}

export interface LegalDocument {
  type: LegalDocumentType;
  status: LegalDocumentStatus;

  eyebrow: string;
  title: string;
  intro: string;

  version?: string | null;
  /** ISO 8601 date, only ever from the document source. */
  effectiveDate?: string | null;
  updatedAt?: string | null;

  sections: LegalSection[];

  seoTitle?: string | null;
  seoDescription?: string | null;

  finalCta: {
    title: string;
    primary: LinkAction;
    secondary?: LinkAction;
  };
}

export type LegalResult =
  | { ok: true; document: LegalDocument | null }
  | { ok: false; message: string };

export interface LegalRepository {
  getTerms(): Promise<LegalResult>;
  getPrivacy(): Promise<LegalResult>;
}

export function isDraft(document: LegalDocument): boolean {
  return document.status !== 'published';
}
