import type { Metadata } from 'next';

import LegalPage from '@/components/legal/LegalPage';
import { getLegalRepository } from '@/lib/legal/repository';
import { isDraft } from '@/lib/legal/types';
import LegalError from './error';
import { buildMetadata } from '@/lib/seo/metadata';

export const dynamic = 'force-dynamic';

const FALLBACK_TITLE = 'Privacy Policy | Connection Rave';
const FALLBACK_DESCRIPTION =
  'Review the current privacy policy draft for Connection Rave website enquiries, booking requests and communications.';

export async function generateMetadata(): Promise<Metadata> {
  const result = await getLegalRepository().getPrivacy();
  const document = result.ok ? result.document : null;
  return buildMetadata({ title: document?.seoTitle ?? FALLBACK_TITLE, description: document?.seoDescription ?? FALLBACK_DESCRIPTION, path: '/privacy', canonicalOverride: document?.canonicalOverride, indexable: Boolean(document && !isDraft(document) && document.indexable !== false), follow: document?.followLinks });
}

/** Server Component; shares its layout with the other legal document. */
export default async function PrivacyPage() {
  const result = await getLegalRepository().getPrivacy();
  if (!result.ok) return <LegalError errorMessage={result.message} />;
  return <LegalPage type="privacy" document={result.document} />;
}
