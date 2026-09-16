import type { FaqCategoryItem, FaqItem } from './faq-types';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Items whose question, answer, category or keywords contain every word of the
 * query. An empty query returns everything, in the original order.
 */
export function searchFaq(
  items: FaqItem[],
  categories: FaqCategoryItem[],
  query: string,
): FaqItem[] {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (terms.length === 0) return items;

  return items.filter((item) => {
    const label = categories.find((c) => c.id === item.category)?.label ?? item.category;
    const haystack = normalize(
      [item.question, item.answer, label, ...(item.keywords ?? [])].join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}
