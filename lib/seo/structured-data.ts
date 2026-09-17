import { canonicalUrl } from './canonical';

export type JsonLd = Record<string, unknown>;

export function jsonLd(value: JsonLd | null) {
  if (!value) return null;
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Connection Rave',
    url: canonicalUrl('/'),
    logo: canonicalUrl('/assets/logo-connection.svg'),
  } satisfies JsonLd;
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Connection Rave',
    url: canonicalUrl('/'),
  } satisfies JsonLd;
}

export function eventSchema(input: {
  name: string;
  path: string;
  image?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: { name: string; address?: string | null; city?: string | null; country?: string | null } | null;
}) {
  if (!input.startDate) return null;
  const start = new Date(input.startDate);
  if (Number.isNaN(start.getTime())) return null;
  const value: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: input.name,
    url: canonicalUrl(input.path),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
  value.startDate = start.toISOString();
  if (input.endDate && !Number.isNaN(new Date(input.endDate).getTime())) value.endDate = new Date(input.endDate).toISOString();
  if (input.description) value.description = input.description;
  if (input.image) value.image = [input.image.startsWith('http') ? input.image : canonicalUrl(input.image)];
  if (input.venue) value.location = { '@type': 'Place', name: input.venue.name, address: { '@type': 'PostalAddress', streetAddress: input.venue.address ?? undefined, addressLocality: input.venue.city ?? undefined, addressCountry: input.venue.country ?? undefined } };
  return value;
}

export function articleSchema(input: { title: string; description?: string | null; path: string; image?: string | null; publishedAt?: string | null; updatedAt?: string | null; author?: string | null; published: boolean }) {
  if (!input.published || !input.publishedAt) return null;
  const published = new Date(input.publishedAt);
  if (Number.isNaN(published.getTime())) return null;
  const value: JsonLd = { '@context': 'https://schema.org', '@type': 'Article', headline: input.title, mainEntityOfPage: canonicalUrl(input.path), datePublished: published.toISOString(), publisher: { '@type': 'Organization', name: 'Connection Rave', url: canonicalUrl('/') } };
  if (input.description) value.description = input.description;
  if (input.updatedAt && !Number.isNaN(new Date(input.updatedAt).getTime())) value.dateModified = new Date(input.updatedAt).toISOString();
  if (input.image) value.image = [input.image.startsWith('http') ? input.image : canonicalUrl(input.image)];
  if (input.author) value.author = { '@type': 'Person', name: input.author };
  return value;
}

export function productSchema(input: { title: string; description?: string | null; path: string; image?: string | null; status: string; priceMinor?: number | null; currency?: string | null; sku?: string | null; availability?: string | null }) {
  if (input.status !== 'active' || input.priceMinor == null || !input.currency) return null;
  const value: JsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: input.title, url: canonicalUrl(input.path), offers: { '@type': 'Offer', priceCurrency: input.currency, price: (input.priceMinor / 100).toFixed(2), availability: `https://schema.org/${input.availability === 'sold-out' ? 'OutOfStock' : 'InStock'}`, url: canonicalUrl(input.path) } };
  if (input.description) value.description = input.description;
  if (input.image) value.image = [input.image.startsWith('http') ? input.image : canonicalUrl(input.image)];
  if (input.sku) value.sku = input.sku;
  return value;
}

export function faqSchema(items: Array<{ question: string; answer: string; published?: boolean }>) {
  const eligible = items.filter((item) => item.published !== false && item.question.trim() && item.answer.trim());
  if (!eligible.length) return null;
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: eligible.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) } satisfies JsonLd;
}
