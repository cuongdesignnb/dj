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
  VipBookingFormContent,
  VipHeroContent,
  VipMapContent,
  VipProcessStep,
  VipPageState,
} from './types';
import { eventDateText, eventScheduleText } from '@/lib/events/presentation';

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
  if (!title || !str(value.id) || !str(value.slug)) return null;
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
  const capacity = value.capacity;
  const minBottles = value.minBottleSelections;
  const maxBottles = value.maxBottleSelections;
  const included = value.includedBottleCount;
  const paymentMode = value.paymentMode;
  if (!id || !price || !str(value.name)
    || typeof capacity !== 'number' || !Number.isSafeInteger(capacity) || capacity < 1
    || typeof minBottles !== 'number' || !Number.isSafeInteger(minBottles) || minBottles < 0
    || typeof maxBottles !== 'number' || !Number.isSafeInteger(maxBottles) || maxBottles < minBottles
    || typeof included !== 'number' || !Number.isSafeInteger(included) || included < maxBottles
    || !['request-only', 'full-payment', 'deposit'].includes(str(paymentMode))) return null;
  return {
    id,
    name: str(value.name, 'Booth Package'),
    price,
    paymentMode: paymentMode as VipPackage['paymentMode'],
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

function finalCta(value: unknown): VipFinalCtaData | null {
  if (!isRecord(value)) return null;
  const title = str(value.title);
  const primary =
    isRecord(value.primary) && typeof value.primary.label === 'string' && typeof value.primary.href === 'string'
      ? { label: value.primary.label, href: value.primary.href }
      : null;
  if (!title || !primary) return null;
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

  const tablesRaw = isRecord(raw.tablesContent) ? raw.tablesContent : {};
  const bookingRaw = isRecord(raw.bookingContent) ? raw.bookingContent : {};
  const hero = (value: unknown): VipHeroContent => {
    const item = isRecord(value) ? value : {};
    return { breadcrumb: str(item.breadcrumb), eyebrow: str(item.eyebrow), titleLine1: str(item.titleLine1), titleLine2: str(item.titleLine2), description: str(item.description), image: isRecord(item.image) ? media(item.image) : null, sideNotes: Array.isArray(item.sideNotes) ? item.sideNotes.filter((entry): entry is string => typeof entry === 'string') : [], footNotes: Array.isArray(item.footNotes) ? item.footNotes.filter((entry): entry is string => typeof entry === 'string') : [] };
  };
  const mapRaw = isRecord(tablesRaw.map) ? tablesRaw.map : {};
  const map: VipMapContent = { eyebrow: str(mapRaw.eyebrow), title: str(mapRaw.title), description: str(mapRaw.description), disclaimer: str(mapRaw.disclaimer), stageLabel: str(mapRaw.stageLabel), infoTitle: str(tablesRaw.infoTitle), infoContext: str(tablesRaw.infoContext), faqContext: str(tablesRaw.faqContext) };
  const formRaw = isRecord(bookingRaw.form) ? bookingRaw.form : {};
  const bookingForm: VipBookingFormContent = { heading: str(formRaw.heading), description: str(formRaw.description), nameLabel: str(formRaw.nameLabel), emailLabel: str(formRaw.emailLabel), phoneLabel: str(formRaw.phoneLabel), groupSizeLabel: str(formRaw.groupSizeLabel), boothLabel: str(formRaw.boothLabel), bottleLabel: str(formRaw.bottleLabel), specialRequestLabel: str(formRaw.specialRequestLabel), submitLabel: str(formRaw.submitLabel), notesTitle: str(bookingRaw.notesTitle), notesContext: str(bookingRaw.notesContext), faqContext: str(bookingRaw.faqContext) };
  const tablesCta = finalCta(tablesRaw.finalCta);
  const bookingCta = finalCta(bookingRaw.finalCta);
  if (!tablesCta || !bookingCta) return null;

  return {
    event,
    bookingEnabled: raw.bookingEnabled === true,
    allowBoothlessRequest: raw.allowBoothlessRequest === true,
    squareEnabled: raw.squareEnabled === true,
    package: pkg,
    booths,
    bottles,
    tablesHero: hero(tablesRaw.hero),
    tablesMap: map,
    bookingHero: hero(bookingRaw.hero),
    bookingTabs: isRecord(bookingRaw.tabs) ? { tickets: str(bookingRaw.tabs.tickets), vip: str(bookingRaw.tabs.vip) } : { tickets: '', vip: '' },
    bookingForm,
    mapDisclaimer: map.disclaimer,
    infoItems: infoItems(raw.infoItems),
    faq: faqItems(raw.faq),
    processSteps: processSteps(raw.processSteps),
    bookingNotes: bookingNotes(raw.bookingNotes),
    bookingFaq: faqItems(raw.bookingFaq),
    tablesCta,
    bookingCta,
    footer: footer(raw.footer),
  };
}

/** Classify the real API contract before requiring a package for the interactive UI. */
export function normalizeVipState(eventRaw: unknown, vipRaw: unknown, tablesRaw: unknown, bookingRaw: unknown): VipPageState {
  const invalid = (): VipPageState => ({ kind: 'invalid-response', message: 'We received data this page could not read.' });
  if (!isRecord(eventRaw) || !isRecord(vipRaw) || !isRecord(vipRaw.settings)
    || !Array.isArray(vipRaw.packages) || !Array.isArray(vipRaw.booths)) return invalid();
  const settings = vipRaw.settings;
  const event = eventContext({
    id: eventRaw.id, slug: eventRaw.slug, title: eventRaw.title, subtitle: eventRaw.eyebrow,
    venue: isRecord(eventRaw.venue) ? [eventRaw.venue.name, eventRaw.venue.city].filter((v) => typeof v === 'string').join(', ') : '',
    date: eventDateText(eventRaw.startAt), dateStatus: str(eventRaw.dateStatus).toLowerCase(),
    schedule: eventScheduleText(eventRaw.startAt, eventRaw.endAt), scheduleStatus: str(eventRaw.scheduleStatus).toLowerCase(),
    image: eventRaw.poster ?? eventRaw.hero,
  });
  if (!event || settings.id !== event.id || typeof settings.vipEnabled !== 'boolean'
    || typeof settings.vipBookingEnabled !== 'boolean' || !str(settings.vipAvailabilityMode)) return invalid();
  const content = { tables: isRecord(tablesRaw) ? tablesRaw : null, booking: isRecord(bookingRaw) ? bookingRaw : null };
  const context = { event, content };
  if (!settings.vipEnabled) return { kind: 'vip-disabled', ...context };
  if (!content.tables || !content.booking) return { kind: 'not-configured', reason: 'content', ...context };
  if (!vipRaw.packages.length) return { kind: 'no-active-package', ...context };
  const defaultId = settings.vipDefaultPackageId;
  if (defaultId != null && (typeof defaultId !== 'string' || !defaultId)) return invalid();
  // An explicit disabled/missing default is configuration, never a silent switch
  // to another active package. None retains the existing first-active behavior.
  const pkg = defaultId ? vipRaw.packages.find((item) => isRecord(item) && item.id === defaultId) : vipRaw.packages[0];
  if (defaultId && !pkg) return { kind: 'no-active-package', ...context };
  if (!isRecord(pkg) || !Array.isArray(pkg.bottles)) return invalid();
  const normalizedPackage = vipPackage({ ...pkg, price: { amountMinor: pkg.priceMinor, currency: pkg.currency } });
  if (!normalizedPackage || vipRaw.booths.some((v) => !booth(v)) || pkg.bottles.some((v) => !bottle(v))) return invalid();
  const allowBoothlessRequest = settings.vipAvailabilityMode === 'REQUEST_ONLY' && normalizedPackage.paymentMode === 'request-only';
  const data = normalizeVipPage({
    event, package: { ...pkg, price: normalizedPackage.price }, booths: vipRaw.booths,
    bottles: pkg.bottles.map((item, index) => ({ ...item, tint: ['#A6A6B2', '#F3B35A', '#E46A6A', '#8AC3FF', '#B78CFF', '#7BE0B2'][index % 6] })),
    tablesContent: content.tables, bookingContent: content.booking,
    infoItems: content.tables.infoItems, faq: content.tables.faq,
    processSteps: content.booking.processSteps, bookingNotes: content.booking.bookingNotes, bookingFaq: content.booking.faq,
    bookingEnabled: settings.vipBookingEnabled, allowBoothlessRequest, squareEnabled: settings.vipSquareEnabled,
  });
  if (!data) return invalid();
  // Backend accepts only AVAILABLE booths. Keep the map labels but disable other booth selections.
  data.booths = data.booths.map((item) => ({ ...item, requestable: item.requestable && item.availability === 'available' }));
  if (!data.bookingEnabled) return { kind: 'booking-disabled', data, canRequest: false };
  if (!data.booths.length) return { kind: 'no-booths', data, canRequest: allowBoothlessRequest };
  if (!data.booths.some((item) => item.requestable)) return { kind: 'no-availability', data, canRequest: false };
  return { kind: 'ready', data, canRequest: true };
}
