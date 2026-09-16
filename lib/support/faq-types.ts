// FAQ model for /faq.
//
// Answers are plain text. There is no HTML path, so CMS content can never be
// injected as markup.

export type FaqCategory = 'tickets' | 'entry' | 'vip-tables' | 'venue';

export type FaqIcon = 'ticket' | 'entry' | 'crown' | 'pin';

export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface LinkAction {
  label: string;
  href: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  keywords?: string[];
  sortOrder: number;
  published: boolean;
}

export interface FaqCategoryItem {
  id: FaqCategory;
  label: string;
  icon: FaqIcon;
  sortOrder: number;
}

export interface FaqPageData {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    visual: MediaAsset;
    sideNotes: string[];
  };

  categories: FaqCategoryItem[];
  items: FaqItem[];

  finalCta: {
    title: string;
    description?: string;
    primary: LinkAction;
    secondary?: LinkAction;
    background?: MediaAsset;
  };
}

export type RepositoryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: 'network' | 'http' | 'invalid' | 'config'; message: string } };

export interface FaqRepository {
  getFaqPage(): Promise<RepositoryResult<FaqPageData>>;
}
