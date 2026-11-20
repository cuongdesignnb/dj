import type { Metadata } from 'next';

import { publicApi } from '@/lib/api/public';
import { HOME_SECTION_DEFAULTS } from '@/lib/admin/content/definitions';
import { eventDateText, eventScheduleText } from '@/lib/events/presentation';
import { youtubeId } from '@/lib/home/youtube';
import Header from '@/components/home/Header';
import HeroSection from '@/components/home/HeroSection';
import UpcomingEvents from '@/components/home/UpcomingEvents';
import AboutConnection from '@/components/home/AboutConnection';
import LineupPreview from '@/components/home/LineupPreview';
import PastEventsGallery from '@/components/home/PastEventsGallery';
import Aftermovies from '@/components/home/Aftermovies';
import ContactNewsletter from '@/components/home/ContactNewsletter';
import PartnersFooter from '@/components/home/PartnersFooter';
import type { HomeAftermovie, HomeAlbum, HomeArtist, HomeEventCard, HomeFooterData, HomeHeroContent, HomeMedia, HomePartner, HomeSectionCopy, HomeTicketProvider } from '@/components/home/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Connection Rave | Music, Events & Experiences',
  description: 'Connection brings music, energy and people together. Find upcoming events, artists, aftermovies and past nights.',
  openGraph: {
    title: 'Connection Rave',
    description: 'Connection brings music, energy and people together. Find upcoming events, artists, aftermovies and past nights.',
    images: ['/assets/event-poster.jpg'],
  },
};

type ApiRecord = Record<string, any>;
type SectionKey = keyof typeof HOME_SECTION_DEFAULTS;

async function readPublic<T>(path: string): Promise<T | null> {
  const result = await publicApi<T>(path, { timeoutMs: 5000 });
  return result.ok ? result.data : null;
}

function record(value: unknown): ApiRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : {};
}

function media(value: unknown, options?: { presentation?: 'hero' }): HomeMedia | null {
  const raw = record(value);
  if (typeof raw.src !== 'string' || !raw.src) return null;
  const src = options?.presentation === 'hero' && raw.src.startsWith('/api/v1/media/')
    ? `${raw.src}${raw.src.includes('?') ? '&' : '?'}presentation=hero`
    : raw.src;
  return { src, alt: typeof raw.alt === 'string' ? raw.alt : '', width: typeof raw.width === 'number' ? raw.width : null, height: typeof raw.height === 'number' ? raw.height : null };
}

function text(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

/** Localised Admin copy ({ en: '…' } or a plain string); empty means "use the default". */
function copyText(value: unknown, fallback: string) {
  const raw = typeof value === 'string' ? value : text(record(value).en);
  return raw.trim() || fallback;
}

/** Site paths and https URLs only (media library files are /api/v1/media/<id>). */
function safeMediaSrc(value: unknown): string | null {
  return typeof value === 'string' && (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) ? value : null;
}

function safeExternalUrl(value: unknown) {
  return typeof value === 'string' && /^https:\/\//.test(value) ? value : null;
}

function safeLink(value: unknown, fallback: string) {
  const raw = text(value).trim();
  return raw && (raw.startsWith('/') || raw.startsWith('#') || /^https:\/\//.test(raw)) ? raw : fallback;
}

/**
 * Copy saved by the previous homepage (event-focused) still sits in Admin. Those exact
 * old defaults read as the new section names instead, so "Featured Artists" says so.
 */
const LEGACY_COPY: Partial<Record<SectionKey, { eyebrow?: string[]; title?: string[]; ctaLabel?: string[] }>> = {
  lineup: { eyebrow: ['Lineup / Music'], ctaLabel: ['View Lineup'] },
  partners: { title: ['Partners'] },
};

function sectionCopy(content: ApiRecord, key: SectionKey): HomeSectionCopy {
  const saved = record(content[key]);
  const defaults = HOME_SECTION_DEFAULTS[key];
  const legacy = LEGACY_COPY[key] ?? {};
  const pick = (field: 'eyebrow' | 'title', fallback: string) => {
    const value = copyText(saved[field], fallback);
    return legacy[field]?.includes(value) ? fallback : value;
  };
  const ctaLabel = text(saved.ctaLabel).trim();
  return {
    enabled: saved.enabled !== false,
    eyebrow: pick('eyebrow', defaults.eyebrow.en),
    title: pick('title', defaults.title.en),
    description: copyText(saved.description, defaults.description.en),
    ctaLabel: ctaLabel && !legacy.ctaLabel?.includes(ctaLabel) ? ctaLabel : defaults.ctaLabel,
    ctaHref: safeLink(saved.ctaHref, defaults.ctaHref),
  };
}

function eventCard(row: ApiRecord): HomeEventCard {
  const settings = record(row.ticketSettings);
  const venue = record(row.venue);
  const providerUrl = settings.externalProviderEnabled === true ? safeExternalUrl(settings.providerUrl) : null;
  const provider: HomeTicketProvider | null = providerUrl ? { name: text(settings.providerName, 'the ticket provider') || 'the ticket provider', url: providerUrl } : null;
  return {
    slug: text(row.slug),
    title: text(row.title, text(row.slug, 'Event')),
    eyebrow: text(row.eyebrow) || null,
    poster: media(row.poster) ?? media(row.hero),
    date: text(row.dateStatus).toUpperCase() === 'CONFIRMED' ? eventDateText(row.startAt) : null,
    time: text(row.scheduleStatus).toUpperCase() === 'CONFIRMED' ? eventScheduleText(row.startAt, row.endAt) : null,
    venue: [text(venue.name), text(venue.city)].filter(Boolean).join(', ') || null,
    genres: Array.isArray(row.genres) ? row.genres.filter((genre: unknown): genre is string => typeof genre === 'string') : [],
    provider,
  };
}

async function loadHomeData() {
  const [upcomingRows, pastRows, albumRows, artistRows, partnerRows, bootstrap] = await Promise.all([
    readPublic<ApiRecord[]>('/events'),
    readPublic<ApiRecord[]>('/events/past'),
    readPublic<ApiRecord[]>('/gallery'),
    readPublic<ApiRecord[]>('/artists'),
    readPublic<ApiRecord[]>('/partners'),
    readPublic<ApiRecord>('/site/bootstrap'),
  ]);

  const homePage = Array.isArray(bootstrap?.pages) ? bootstrap.pages.find((page: ApiRecord) => page.slug === 'home') : null;
  const content = record(homePage?.content);
  const heroSaved = record(content.hero);
  const heroDefaults = HOME_SECTION_DEFAULTS.hero;
  // The old event-focused hero saved "Get Tickets → /tickets"; the brand hero points at the events list instead.
  const legacyCta = heroSaved.ctaHref === '/tickets' && heroSaved.ctaLabel === 'Get Tickets';
  const secondaryLabel = heroSaved.secondaryLabel === undefined ? 'About Connection' : text(heroSaved.secondaryLabel).trim();
  const hero: HomeHeroContent = {
    eyebrow: copyText(heroSaved.eyebrow, heroDefaults.eyebrow.en),
    title: copyText(heroSaved.title, heroDefaults.title.en),
    description: copyText(heroSaved.description, heroDefaults.description.en),
    primary: legacyCta
      ? { label: heroDefaults.ctaLabel, href: heroDefaults.ctaHref }
      : { label: text(heroSaved.ctaLabel).trim() || heroDefaults.ctaLabel, href: safeLink(heroSaved.ctaHref, heroDefaults.ctaHref) },
    secondary: secondaryLabel ? { label: secondaryLabel, href: safeLink(heroSaved.secondaryHref, '#about-connection') } : null,
  };

  const upcoming = (Array.isArray(upcomingRows) ? upcomingRows : []).filter((row) => text(row.slug)).map(eventCard);
  const past = (Array.isArray(pastRows) ? pastRows : []).filter((row) => text(row.slug)).map(eventCard);
  const albums: HomeAlbum[] = (Array.isArray(albumRows) ? albumRows : []).filter((row) => text(row.slug)).slice(0, 3).map((row) => ({
    slug: text(row.slug),
    title: text(row.title, text(row.slug)),
    cover: media(row.cover) ?? media(row.hero),
    count: Array.isArray(row.media) ? row.media.length : 0,
  }));

  const lineupSaved = record(content.lineup);
  const allArtists = Array.isArray(artistRows) ? artistRows : [];
  const featured = allArtists.filter((row) => row.featured === true);
  const artistSource = lineupSaved.featuredOnly !== false && featured.length > 0 ? featured : allArtists;
  const artists: HomeArtist[] = artistSource.map((row) => ({
    name: text(row.name, text(row.slug, 'Artist')),
    country: text(row.country, '—'),
    year: text(row.year, ''),
    href: `/lineup/${encodeURIComponent(text(row.slug))}`,
    image: media(row.portrait)?.src || media(row.heroImage)?.src || '',
  }));

  const films: HomeAftermovie[] = (Array.isArray(record(content.aftermovies).items) ? record(content.aftermovies).items : [])
    .map((row: unknown, index: number) => {
      const item = record(row);
      return {
        id: text(item.id) || `film-${index}`,
        title: text(item.title).trim(),
        youtubeId: youtubeId(item.youtubeUrl),
        video: safeMediaSrc(media(item.video)?.src),
        poster: safeMediaSrc(media(item.poster)?.src),
      };
    })
    .filter((film: HomeAftermovie) => film.youtubeId || film.video);

  const partners: HomePartner[] = (Array.isArray(partnerRows) ? partnerRows : []).map((row) => ({
    id: text(row.id, text(row.slug)),
    label: text(row.name, text(row.slug, 'Partner')),
    href: safeExternalUrl(row.websiteUrl),
  }));
  const settings = record(bootstrap?.settings);
  const socials = (['facebook', 'instagram', 'tiktok', 'youtube'] as const).flatMap((platform) => {
    const href = safeExternalUrl(settings[`social.${platform}`]);
    return href ? [{ platform, href }] : [];
  });
  const footer: HomeFooterData = {
    partners,
    socials,
    email: text(settings['contact.email']).trim() || null,
    phone: text(settings['contact.phone']).trim() || null,
    address: text(settings['contact.address']).trim() || null,
  };

  return {
    hero,
    heroAnimation: media(heroSaved.animation, { presentation: 'hero' }),
    heroBackground: { image: safeMediaSrc(media(heroSaved.media)?.src), video: safeMediaSrc(media(heroSaved.video)?.src) },
    copy: {
      upcoming: sectionCopy(content, 'upcoming'),
      about: sectionCopy(content, 'about'),
      lineup: sectionCopy(content, 'lineup'),
      pastEvents: sectionCopy(content, 'pastEvents'),
      aftermovies: sectionCopy(content, 'aftermovies'),
      partners: sectionCopy(content, 'partners'),
      contact: sectionCopy(content, 'contact'),
    },
    aboutImage: media(record(content.about).media) ?? albums.find((album) => album.cover)?.cover ?? media(heroSaved.media),
    stats: [
      { value: past.length, label: 'Events hosted' },
      { value: allArtists.length, label: 'Artists' },
      { value: upcoming.length, label: 'Coming up' },
    ],
    upcoming,
    past: past.slice(0, 4),
    albums,
    artists,
    films,
    footer,
  };
}

/** The brand homepage. Each event has its own page; this one introduces Connection and lets visitors pick a night. */
export default async function HomePage() {
  const data = await loadHomeData();
  const { copy } = data;

  return (
    <main className="relative min-h-screen bg-rave-black text-white noise-overlay">
      <Header />
      <HeroSection content={data.hero} animation={data.heroAnimation} background={data.heroBackground} />
      {copy.upcoming.enabled && <UpcomingEvents copy={copy.upcoming} events={data.upcoming} />}
      {copy.about.enabled && <AboutConnection copy={copy.about} image={data.aboutImage} stats={data.stats} />}
      {copy.lineup.enabled && data.artists.length > 0 && <LineupPreview artists={data.artists} copy={copy.lineup} />}
      {copy.pastEvents.enabled && <PastEventsGallery copy={copy.pastEvents} events={data.past} albums={data.albums} />}
      {copy.aftermovies.enabled && <Aftermovies copy={copy.aftermovies} films={data.films} />}
      <PartnersFooter footer={data.footer} brand copy={copy.partners} showPartners={copy.partners.enabled}>
        {copy.contact.enabled && <ContactNewsletter copy={copy.contact} footer={data.footer} />}
      </PartnersFooter>
    </main>
  );
}
