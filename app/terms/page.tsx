import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { getLegalRepository } from '@/lib/legal/repository';
import { isDraft } from '@/lib/legal/types';
import LegalError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

const FALLBACK_TITLE = 'Terms & Conditions | Connection Rave';
const FALLBACK_DESCRIPTION =
  'Review the current draft terms and conditions for Connection Rave website, tickets, entry and VIP enquiries.';

export async function generateMetadata(): Promise<Metadata> {
  const result = await getLegalRepository().getTerms();
  const document = result.ok ? result.document : null;
  return buildMetadata({ title: document?.seoTitle ?? FALLBACK_TITLE, description: document?.seoDescription ?? FALLBACK_DESCRIPTION, path: '/terms', canonicalOverride: document?.canonicalOverride, indexable: Boolean(document && !isDraft(document) && document.indexable !== false), follow: document?.followLinks });
}

/** Server Component; shares its layout with the other legal document. */
export default async function TermsPage() {
  const result = await getLegalRepository().getTerms();
  if (!result.ok) return <LegalError errorMessage={result.message} />;
  return <LegalPage type="terms" document={result.document} />;
}
