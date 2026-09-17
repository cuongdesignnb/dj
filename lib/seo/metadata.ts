import type { Metadata } from 'next';
import { canonicalUrl } from './canonical';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, robotsFor, type Indexability } from './config';

export type SeoImage = { url: string; alt?: string | null; width?: number | null; height?: number | null };

/**
 * A crawlable page must still have a share image when its editor has not
 * selected a page-specific asset yet. This is a real local asset, not a
 * generated placeholder or business claim.
 */
export const DEFAULT_OG_IMAGE = '/assets/event-poster.jpg';

function absoluteImageUrl(url: string) {
  return /^https?:\/\//i.test(url) ? url : canonicalUrl(url);
}

export function buildMetadata(input: {
  title?: string | null;
  description?: string | null;
  path: string;
  image?: SeoImage | null;
  type?: 'website' | 'article';
  indexable?: boolean | null;
  follow?: boolean | null;
  canonicalOverride?: string | null;
}): Metadata {
  const title = input.title?.trim() || DEFAULT_TITLE;
  const description = input.description?.trim() || DEFAULT_DESCRIPTION;
  const selectedImage = input.image?.url
    ? input.image
    : { url: DEFAULT_OG_IMAGE, alt: 'Connection Rave event poster', width: 1200, height: 800 };
  const images = [
    {
      url: absoluteImageUrl(selectedImage.url),
      ...(selectedImage.alt ? { alt: selectedImage.alt } : {}),
      ...(selectedImage.width != null ? { width: selectedImage.width } : {}),
      ...(selectedImage.height != null ? { height: selectedImage.height } : {}),
    },
  ];
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(input.path, input.canonicalOverride) },
    robots: robotsFor({ indexable: input.indexable, follow: input.follow } satisfies Indexability),
    openGraph: { title, description, type: input.type ?? 'website', url: canonicalUrl(input.path, input.canonicalOverride), images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((image) => image.url) },
  };
}
