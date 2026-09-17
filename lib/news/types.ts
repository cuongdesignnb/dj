// Canonical news model, shared by /news and /news/[slug].
//
// `status` is the honesty switch. A 'preview' article is placeholder editorial
// written to stand the page up — it carries no publication date, and the UI
// says "Preview" where a published article would show one.
//
// Body is structured blocks, not an HTML string: there is no sanitiser in this
// project, so no path exists for CMS markup to reach dangerouslySetInnerHTML.

export type NewsCategory =
  | 'announcements'
  | 'event-updates'
  | 'artist-stories'
  | 'community'
  | 'press';

export type ArticleStatus = 'draft' | 'preview' | 'published' | 'archived';

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string | null;
}

export interface ParagraphBlock {
  id: string;
  type: 'paragraph';
  text: string;
}

export interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 2 | 3;
  text: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  image: MediaAsset;
}

export interface QuoteBlock {
  id: string;
  type: 'quote';
  text: string;
  /** Null unless a real person or team is on record saying it. */
  attribution?: string | null;
}

export interface ListBlock {
  id: string;
  type: 'list';
  style: 'bullet' | 'numbered';
  items: string[];
}

export type ArticleContentBlock =
  | ParagraphBlock
  | HeadingBlock
  | ImageBlock
  | QuoteBlock
  | ListBlock;

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  status: ArticleStatus;

  heroImage: MediaAsset;
  cardImage?: MediaAsset | null;

  /** ISO 8601, or null while the article is a preview. Never invented. */
  publishedAt?: string | null;
  updatedAt?: string | null;

  /** CMS override; otherwise estimated from the body. */
  readingTimeMinutes?: number | null;

  /** Stored clean, without a leading "#": the UI adds that. */
  tags: string[];
  quickSummary: string[];
  body: ArticleContentBlock[];

  featured: boolean;
  eventId?: string | null;
  eventHref?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalOverride?: string | null;
  indexable?: boolean;
  followLinks?: boolean;
}

export interface NewsHeroData {
  eyebrow: string;
  titleLines: string[];
  description: string;
  visual: MediaAsset;
  sideNotes: string[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

export interface NewsFinalCta {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  background?: MediaAsset;
}

export interface NewsPageData {
  hero: NewsHeroData;
  featuredArticle?: NewsArticle | null;
  articles: NewsArticle[];
  finalCta: NewsFinalCta;
  footer: {
    email?: string | null;
    phone?: string | null;
    partners: Array<{ id: string; name: string; logo: MediaAsset }>;
    socials: Array<{
      id: string;
      platform: 'instagram' | 'facebook' | 'youtube' | 'tiktok';
      url: string | null;
    }>;
    legalTermsHref?: string | null;
    legalPrivacyHref?: string | null;
  };
}

export type NewsFilter = 'all' | NewsCategory;
