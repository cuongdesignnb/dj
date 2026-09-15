import type {
  MediaAsset,
  Money,
  TicketEventInfo,
  TicketFaqItem,
  TicketInfoItem,
  TicketProviderAction,
  TicketTier,
  TicketTrustItem,
  TicketsFinalCta,
  TicketsFooterData,
  TicketsPageData,
} from './types';

// Normalizes an API payload into TicketsPageData.
//
// Never blends in local content: a response this page cannot read is an error
// the page shows, not something papered over with mock prices. Prices in
// particular are only accepted as integer minor units — a float would quietly
// become a wrong total.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function media(value: unknown): MediaAsset {
  if (!isRecord(value)) return { src: '', alt: '' };
  return {
    src: str(value.src),
    alt: str(value.alt),
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
  };
}

/** Returns null unless the amount is a safe integer — no float money. */
function money(value: unknown): Money | null {
  if (!isRecord(value)) return null;
  const amount = value.amountMinor;
  const currency = str(value.currency);
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  return { amountMinor: amount, currency };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

function tier(value: unknown): TicketTier | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const name = str(value.name);
  const price = money(value.price);
  if (!id || !name || !price) return null;

  const availability = isRecord(value.availability)
    ? {
        status: (['available', 'low', 'sold-out', 'unknown'] as const).includes(
          value.availability.status as 'available' | 'low' | 'sold-out' | 'unknown',
        )
          ? (value.availability.status as 'available' | 'low' | 'sold-out' | 'unknown')
          : ('unknown' as const),
        remaining:
          typeof value.availability.remaining === 'number'
            ? value.availability.remaining
            : null,
      }
    : undefined;

  return {
    id,
    name,
    description: str(value.description),
    price,
    badge: nullableStr(value.badge),
    icon: str(value.icon, 'Ticket'),
    features: strings(value.features),
    purchasableOnline: value.purchasableOnline === true,
    purchasableAtDoor: value.purchasableAtDoor === true,
    minQuantity: typeof value.minQuantity === 'number' ? Math.max(0, Math.trunc(value.minQuantity)) : 0,
    maxQuantity:
      typeof value.maxQuantity === 'number' ? Math.max(0, Math.trunc(value.maxQuantity)) : null,
    defaultQuantity:
      typeof value.defaultQuantity === 'number'
        ? Math.max(0, Math.trunc(value.defaultQuantity))
        : undefined,
    highlighted: value.highlighted === true,
    availability,
  };
}

function eventInfo(value: unknown): TicketEventInfo | null {
  if (!isRecord(value)) return null;
  const title = str(value.title);
  if (!title) return null;
  return {
    id: str(value.id, title),
    slug: str(value.slug, str(value.id, title)),
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    venue: str(value.venue),
    date: nullableStr(value.date),
    dateStatus: value.dateStatus === 'confirmed' ? 'confirmed' : 'tba',
    schedule: nullableStr(value.schedule),
    scheduleStatus: value.scheduleStatus === 'confirmed' ? 'confirmed' : 'tbc',
    image: media(value.image),
  };
}

/**
 * A checkout URL is only honoured when it is an absolute https URL. Anything
 * else — a relative path, a javascript: URI, a bare hostname — is dropped and
 * the CTA falls back to unavailable.
 */
export function safeCheckoutUrl(value: unknown): string | null {
  const raw = nullableStr(value);
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  return parsed.protocol === 'https:' ? parsed.toString() : null;
}

function provider(value: unknown): TicketProviderAction {
  if (!isRecord(value)) {
    return { mode: 'unavailable', checkoutUrl: null, eventExternalId: null };
  }
  const checkoutUrl = safeCheckoutUrl(value.checkoutUrl);
  return {
    providerName: typeof value.providerName === 'string' ? value.providerName : undefined,
    checkoutUrl,
    eventExternalId: nullableStr(value.eventExternalId),
    mode: checkoutUrl ? 'external-link' : 'unavailable',
    unavailableNote:
      typeof value.unavailableNote === 'string'
        ? value.unavailableNote
        : checkoutUrl
          ? undefined
          : 'Ticket link will be available soon.',
  };
}

function trustItems(value: unknown): TicketTrustItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [
      {
        id: str(raw.id, title),
        icon: str(raw.icon, 'ShieldCheck'),
        title,
        description: str(raw.description),
        verificationState:
          raw.verificationState === 'provider-confirmed' ? 'provider-confirmed' : 'marketing-copy',
      },
    ];
  });
}

function infoItems(value: unknown): TicketInfoItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [
      {
        id: str(raw.id, title),
        icon: str(raw.icon, 'Ticket'),
        title,
        description: str(raw.description),
      },
    ];
  });
}

function faq(value: unknown): TicketFaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const question = str(raw.question);
    const answer = str(raw.answer);
    if (!question || !answer) return [];
    return [{ id: str(raw.id, question), question, answer }];
  });
}

function finalCta(value: unknown): TicketsFinalCta | null {
  if (!isRecord(value)) return null;
  const title = str(value.title);
  if (!title) return null;
  const primary = isRecord(value.primary)
    ? { label: str(value.primary.label), href: str(value.primary.href) }
    : null;
  if (!primary || !primary.label || !primary.href) return null;
  const secondary =
    isRecord(value.secondary) && typeof value.secondary.label === 'string'
      ? { label: value.secondary.label, href: str(value.secondary.href) }
      : undefined;
  return {
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    primary,
    secondary,
    background: isRecord(value.background) ? media(value.background) : undefined,
  };
}

function footer(value: unknown): TicketsFooterData {
  const empty: TicketsFooterData = {
    email: null,
    phone: null,
    partners: [],
    socials: [],
    legalTermsHref: null,
    legalPrivacyHref: null,
  };
  if (!isRecord(value)) return empty;

  const partners = Array.isArray(value.partners)
    ? value.partners.flatMap((raw) => {
        if (!isRecord(raw)) return [];
        const name = str(raw.name);
        if (!name) return [];
        return [{ id: str(raw.id, name), name, logo: media(raw.logo) }];
      })
    : [];

  const socials = Array.isArray(value.socials)
    ? value.socials.flatMap((raw) => {
        if (!isRecord(raw)) return [];
        const platform = str(raw.platform);
        if (!['instagram', 'facebook', 'youtube', 'tiktok'].includes(platform)) return [];
        return [
          {
            id: str(raw.id, platform),
            platform: platform as TicketsFooterData['socials'][number]['platform'],
            url: nullableStr(raw.url),
          },
        ];
      })
    : [];

  return {
    email: nullableStr(value.email),
    phone: nullableStr(value.phone),
    partners,
    socials,
    legalTermsHref: nullableStr(value.legalTermsHref),
    legalPrivacyHref: nullableStr(value.legalPrivacyHref),
  };
}

export function normalizeTicketsPage(raw: unknown): TicketsPageData | null {
  if (!isRecord(raw)) return null;

  const event = eventInfo(raw.event);
  const cta = finalCta(raw.finalCta);
  if (!event || !cta) return null;

  const tiers = Array.isArray(raw.tiers)
    ? raw.tiers.flatMap((t) => {
        const parsed = tier(t);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    event,
    tiers,
    provider: provider(raw.provider),
    trustItems: trustItems(raw.trustItems),
    infoItems: infoItems(raw.infoItems),
    faq: faq(raw.faq),
    finalCta: cta,
    footer: footer(raw.footer),
  };
}
