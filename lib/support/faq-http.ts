import type { FaqCategory, FaqItem } from './faq-types';

// Normalizes FAQ payloads. Unpublished items and items missing a question or
// answer are dropped; answers stay plain text.

const CATEGORIES: FaqCategory[] = ['tickets', 'entry', 'vip-tables', 'venue'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function normalizeFaqItems(raw: unknown): FaqItem[] {
  const list = isRecord(raw) && Array.isArray(raw.items) ? raw.items : Array.isArray(raw) ? raw : [];
  return list.flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const category = CATEGORIES.find((c) => c === item.category);
    const question = typeof item.question === 'string' ? item.question.trim() : '';
    const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
    if (!category || !question || !answer || item.published !== true) return [];
    return [
      {
        id: typeof item.id === 'string' && item.id ? item.id : `faq-${index}`,
        category,
        question,
        answer,
        keywords: Array.isArray(item.keywords)
          ? item.keywords.filter((k): k is string => typeof k === 'string')
          : [],
        sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : index,
        published: true,
      },
    ];
  });
}
