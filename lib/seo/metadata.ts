import type { Metadata } from 'next';
import { canonicalUrl } from './canonical';
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, robotsFor, type Indexability } from './config';

export type SeoImage = { url: string; alt?: string | null; width?: number | null; height?: number | null };

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
  const images = input.image?.url
    ? [
        {
          url: input.image.url,
          ...(input.image.alt ? { alt: input.image.alt } : {}),
          ...(input.image.width != null ? { width: input.image.width } : {}),
          ...(input.image.height != null ? { height: input.image.height } : {}),
        },
      ]
    : [];
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl(input.path, input.canonicalOverride) },
    robots: robotsFor({ indexable: input.indexable, follow: input.follow } satisfies Indexability),
    openGraph: { title, description, type: input.type ?? 'website', url: canonicalUrl(input.path, input.canonicalOverride), images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((image) => image.url) },
  };
}
