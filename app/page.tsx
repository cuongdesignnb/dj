import type { Metadata } from 'next';

import { publicApi } from '@/lib/api/public';
import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import EventOverview from '@/components/home/EventOverview';
import LineupPreview from '@/components/home/LineupPreview';
import TicketsSection from '@/components/home/TicketsSection';
import VipTableSection from '@/components/home/VipTableSection';
import PartnersFooter from '@/components/home/PartnersFooter';
import type { HomeArtist, HomeBoothPackage, HomeEvent, HomeFooterData, HomePartner, HomeTicketTier, HomeTrustItem } from '@/components/home/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Connection Rave | Music, Events & Experiences',
  description: 'Published events, artists and experiences from Connection Rave.',
  openGraph: {
    title: 'Connection Rave',
    description: 'Published events, artists and experiences from Connection Rave.',
    images: ['/assets/event-poster.jpg'],
  },
};

type ApiRecord = Record<string, any>;

async function readPublic<T>(path: string): Promise<T | null> {
  const result = await publicApi<T>(path, { timeoutMs: 5000 });
  return result.ok ? result.data : null;
}

function media(value: unknown): { src: string; alt: string } | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as ApiRecord;
  return typeof raw.src === 'string' && raw.src ? { src: raw.src, alt: typeof raw.alt === 'string' ? raw.alt : '' } : null;
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function money(amountMinor: unknown, currency: unknown) {
  if (typeof amountMinor !== 'number' || !Number.isSafeInteger(amountMinor) || amountMinor < 0) return '—';
  const code = typeof currency === 'string' && /^[A-Z]{3}$/.test(currency) ? currency : 'AUD';
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amountMinor / 100);
}

function safeExternalUrl(value: unknown) {
  return typeof value === 'string' && /^https:\/\//.test(value) ? value : null;
}

interface HomeData {
  event: HomeEvent;
  artists: HomeArtist[];
  ticketTiers: HomeTicketTier[];
  trustItems: HomeTrustItem[];
  boothPackage: HomeBoothPackage | null;
  footer: HomeFooterData;
}

async function loadHomeData(): Promise<HomeData | null> {
  const [event, artistRows, ticketRows, vip, partnerRows, bootstrap] = await Promise.all([
    readPublic<ApiRecord>('/events/destiny'),
    readPublic<ApiRecord[]>('/artists'),
    readPublic<ApiRecord[]>('/events/destiny/tickets'),
    readPublic<ApiRecord>('/events/destiny/vip'),
    readPublic<ApiRecord[]>('/partners'),
    readPublic<ApiRecord>('/site/bootstrap'),
  ]);

  if (!event) return null;

  const eventData: HomeEvent = {
    title: text(event.title, text(event.slug, 'Connection Rave')),
    eyebrow: typeof event.eyebrow === 'string' ? event.eyebrow : null,
    shortDescription: typeof event.shortDescription === 'string' ? event.shortDescription : null,
    description: typeof event.description === 'string' ? event.description : null,
    poster: media(event.poster),
    hero: media(event.hero),
    startAt: typeof event.startAt === 'string' ? event.startAt : null,
    dateStatus: text(event.dateStatus, 'TBA'),
    scheduleStatus: text(event.scheduleStatus, 'TBC'),
    venue: {
      name: text(event.venue?.name),
      city: text(event.venue?.city),
      country: text(event.venue?.country),
    },
  };

  const artists: HomeArtist[] = (Array.isArray(artistRows) ? artistRows : []).map((row) => ({
    name: text(row.name, text(row.slug, 'Artist')),
    country: text(row.country, '—'),
    year: text(row.year, ''),
    href: `/lineup/${encodeURIComponent(text(row.slug))}`,
    image: media(row.portrait)?.src || media(row.heroImage)?.src || '',
  }));

  const ticketTiers: HomeTicketTier[] = (Array.isArray(ticketRows) ? ticketRows : []).map((row) => {
    const availabilityStatus = text(row.availabilityStatus, 'UNKNOWN').toUpperCase();
    const availability = availabilityStatus === 'AVAILABLE' ? 'Availability confirmed' : availabilityStatus === 'LOW' ? 'Limited availability' : 'Availability to be confirmed';
    return {
      id: text(row.id, text(row.name)),
      name: text(row.name, 'Ticket'),
      price: money(row.priceMinor, row.currency),
      badge: typeof row.badge === 'string' && row.badge ? row.badge : null,
      features: [availability],
      purchasableOnline: row.purchasableOnline === true,
      purchasableAtDoor: row.purchasableAtDoor === true,
      availabilityStatus,
    };
  });

  const packageRow = vip?.packages?.[0] as ApiRecord | undefined;
  const bottleNames = Array.isArray(packageRow?.bottles) ? packageRow.bottles.map((bottle: ApiRecord) => text(bottle.name)).filter(Boolean) : [];
  const boothPackage: HomeBoothPackage | null = packageRow
    ? {
        name: text(packageRow.name, 'VIP package'),
        price: money(packageRow.priceMinor, packageRow.currency),
        people: typeof packageRow.capacity === 'number' ? `Up to ${packageRow.capacity} guests` : 'Capacity to be confirmed',
        bottles: typeof packageRow.includedBottleCount === 'number' ? `${packageRow.includedBottleCount} included bottles` : 'Bottle inclusions to be confirmed',
        choices: bottleNames,
      }
    : null;

  const partners: HomePartner[] = (Array.isArray(partnerRows) ? partnerRows : []).map((row) => ({
    id: text(row.id, text(row.slug)),
    label: text(row.name, text(row.slug, 'Partner')),
    href: safeExternalUrl(row.websiteUrl),
  }));

  const settings = bootstrap?.settings && typeof bootstrap.settings === 'object' ? bootstrap.settings : {};
  const socialPlatforms = ['facebook', 'instagram', 'tiktok', 'youtube'] as const;
  const socials = socialPlatforms.flatMap((platform) => {
    const href = safeExternalUrl(settings[`social.${platform}`]);
    return href ? [{ platform, href }] : [];
  });

  const footer: HomeFooterData = {
    partners,
    socials,
    email: typeof settings['contact.email'] === 'string' ? settings['contact.email'] : null,
    phone: typeof settings['contact.phone'] === 'string' ? settings['contact.phone'] : null,
    address: typeof settings['contact.address'] === 'string' ? settings['contact.address'] : null,
  };

  const trustItems: HomeTrustItem[] = [
    { icon: 'ShieldCheck', title: 'Published event data', description: 'Ticket details come from the current event record.' },
    { icon: 'BadgeCheck', title: 'Availability is explicit', description: 'Unconfirmed availability is shown as such.' },
    { icon: 'Users', title: 'Need help?', description: 'Contact the team for event and VIP questions.' },
  ];

  return { event: eventData, artists, ticketTiers, trustItems, boothPackage, footer };
}

export default async function HomePage() {
  const data = await loadHomeData();

  if (!data) {
    return (
      <main className="min-h-screen bg-rave-black text-white">
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-40 text-center">
          <h1 className="font-heading text-4xl font-black uppercase">Event details are unavailable</h1>
          <p className="mt-4 text-rave-muted">Please try again shortly.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-rave-black text-white noise-overlay">
      <Header />
      <HeroSection event={data.event} />
      <EventOverview event={data.event} />
      <LineupPreview artists={data.artists} />
      <TicketsSection ticketTiers={data.ticketTiers} trustItems={data.trustItems} />
      <VipTableSection boothPackage={data.boothPackage} />
      <PartnersFooter footer={data.footer} />
    </main>
  );
}
