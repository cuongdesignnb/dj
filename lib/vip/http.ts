import type {
  FaqItem,
  MediaAsset,
  Money,
  VipBooth,
  VipBookingNote,
  VipBottle,
  VipEventContext,
  VipFinalCtaData,
  VipFooterData,
  VipInfoItem,
  VipPackage,
  VipPageData,
  VipProcessStep,
} from './types';

// Normalizes an API payload into VipPageData.
//
// Returns null rather than blending in local content: a response this page
// cannot read is an error to surface, not something to paper over with a price
// and a package that may no longer be current. Prices are only accepted as
// integer minor units.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
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

function money(value: unknown): Money | null {
  if (!isRecord(value)) return null;
  const amount = value.amountMinor;
  const currency = str(value.currency);
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount < 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  return { amountMinor: amount, currency };
}

function eventContext(value: unknown): VipEventContext | null {
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

function vipPackage(value: unknown): VipPackage | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const price = money(value.price);
  if (!id || !price) return null;
  const maxBottles = Math.max(1, Math.trunc(num(value.maxBottleSelections, 3)));
  const paymentMode = value.paymentMode === 'full-payment' || value.paymentMode === 'deposit'
    ? value.paymentMode
    : 'request-only';
  return {
    id,
    name: str(value.name, 'Booth Package'),
    price,
    paymentMode,
    deposit: money(value.deposit),
    capacity: Math.max(1, Math.trunc(num(value.capacity, 1))),
    includedBottleCount: Math.max(0, Math.trunc(num(value.includedBottleCount, 0))),
    minBottleSelections: Math.min(
      maxBottles,
      Math.max(0, Math.trunc(num(value.minBottleSelections, 1))),
    ),
    maxBottleSelections: maxBottles,
    description: str(value.description),
  };
}

const ZONES: VipBooth['zone'][] = ['left', 'right', 'front'];
const AVAILABILITIES: VipBooth['availability'][] = [
  'on-request',
  'available',
  'unavailable',
  'unknown',
];

function booth(value: unknown): VipBooth | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  if (!id) return null;
  return {
    id,
    label: str(value.label, id.toUpperCase()),
    zone: ZONES.includes(value.zone as VipBooth['zone']) ? (value.zone as VipBooth['zone']) : 'front',
    x: Math.min(100, Math.max(0, num(value.x, 50))),
    y: Math.min(100, Math.max(0, num(value.y, 50))),
    requestable: value.requestable !== false,
    availability: AVAILABILITIES.includes(value.availability as VipBooth['availability'])
      ? (value.availability as VipBooth['availability'])
      : 'unknown',
  };
}

function bottle(value: unknown): VipBottle | null {
  if (!isRecord(value)) return null;
  const id = str(value.id);
  const name = str(value.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    image: isRecord(value.image) ? media(value.image) : undefined,
    tint: str(value.tint, '#A6A6B2'),
    enabled: value.enabled !== false,
  };
}

function infoItems(value: unknown): VipInfoItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    const action =
      isRecord(raw.action) && typeof raw.action.label === 'string' && typeof raw.action.href === 'string'
        ? { label: raw.action.label, href: raw.action.href }
        : null;
    return [
      { id: str(raw.id, title), icon: str(raw.icon, 'Crown'), title, description: str(raw.description), action },
    ];
  });
}

function faqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const question = str(raw.question);
    const answer = str(raw.answer);
    if (!question || !answer) return [];
    return [{ id: str(raw.id, question), question, answer }];
  });
}

function processSteps(value: unknown): VipProcessStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [{ id: str(raw.id, title), title, description: str(raw.description) }];
  });
}

function bookingNotes(value: unknown): VipBookingNote[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const title = str(raw.title);
    if (!title) return [];
    return [
      { id: str(raw.id, title), icon: str(raw.icon, 'Users'), title, description: str(raw.description) },
    ];
  });
}

function finalCta(value: unknown, fallback: VipFinalCtaData): VipFinalCtaData {
  if (!isRecord(value)) return fallback;
  const title = str(value.title);
  const primary =
    isRecord(value.primary) && typeof value.primary.label === 'string' && typeof value.primary.href === 'string'
      ? { label: value.primary.label, href: value.primary.href }
      : null;
  if (!title || !primary) return fallback;
  return {
    title,
    subtitle: typeof value.subtitle === 'string' ? value.subtitle : undefined,
    primary,
    secondary:
      isRecord(value.secondary) && typeof value.secondary.label === 'string'
        ? { label: value.secondary.label, href: str(value.secondary.href) }
        : undefined,
    background: isRecord(value.background) ? media(value.background) : undefined,
  };
}

function footer(value: unknown): VipFooterData {
  const empty: VipFooterData = {
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
            platform: platform as VipFooterData['socials'][number]['platform'],
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

export function normalizeVipPage(raw: unknown): VipPageData | null {
  if (!isRecord(raw)) return null;

  const event = eventContext(raw.event);
  const pkg = vipPackage(raw.package);
  if (!event || !pkg) return null;

  const booths = Array.isArray(raw.booths)
    ? raw.booths.flatMap((b) => {
        const parsed = booth(b);
        return parsed ? [parsed] : [];
      })
    : [];

  const bottles = Array.isArray(raw.bottles)
    ? raw.bottles.flatMap((b) => {
        const parsed = bottle(b);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    event,
    package: pkg,
    booths,
    bottles,
    mapDisclaimer: str(raw.mapDisclaimer, 'Booth positions are indicative. A request is not a reservation.'),
    infoItems: infoItems(raw.infoItems),
    faq: faqItems(raw.faq),
    processSteps: processSteps(raw.processSteps),
    bookingNotes: bookingNotes(raw.bookingNotes),
    bookingFaq: faqItems(raw.bookingFaq),
    tablesCta: finalCta(raw.tablesCta, { title: 'REQUEST A VIP EXPERIENCE', primary: { label: 'Send a request', href: '/book-now' } }),
    bookingCta: finalCta(raw.bookingCta, { title: 'STAY CONNECTED', primary: { label: 'View events', href: '/events' } }),
    footer: footer(raw.footer),
  };
}
