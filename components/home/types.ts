export interface HomeMedia {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

export interface HomeEvent {
  title: string;
  eyebrow: string | null;
  shortDescription: string | null;
  description: string | null;
  poster: HomeMedia | null;
  hero: HomeMedia | null;
  startAt: string | null;
  endAt: string | null;
  dateStatus: string;
  scheduleStatus: string;
  venue: { name: string; city: string; country: string };
}

export interface HomeArtist {
  name: string;
  country: string;
  year: string;
  href: string;
  image: string;
}

/** External ticket seller configured in Admin › Ticketing › Ticket Settings. */
export interface HomeTicketProvider {
  name: string;
  url: string;
}

export interface HomePartner {
  id: string;
  label: string;
  href: string | null;
}

export interface HomeSocial {
  platform: 'facebook' | 'instagram' | 'tiktok' | 'youtube';
  href: string;
}

export interface HomeFooterData {
  partners: HomePartner[];
  socials: HomeSocial[];
  email: string | null;
  phone: string | null;
  address: string | null;
}

/** A homepage section's editable copy (Admin › Content › Homepage). */
export interface HomeSectionCopy {
  enabled: boolean;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface HomeLink {
  label: string;
  href: string;
}

/** Brand hero: about Connection, not one event. */
export interface HomeHeroContent {
  eyebrow: string;
  title: string;
  description: string;
  primary: HomeLink;
  secondary: HomeLink | null;
}

export interface HomeEventCard {
  slug: string;
  title: string;
  eyebrow: string | null;
  poster: HomeMedia | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  genres: string[];
  /** Third-party seller when tickets are sold elsewhere. */
  provider: HomeTicketProvider | null;
}

export interface HomeAlbum {
  slug: string;
  title: string;
  cover: HomeMedia | null;
  count: number;
}

export interface HomeAftermovie {
  id: string;
  title: string;
  /** YouTube video id, when the film is on YouTube. */
  youtubeId: string | null;
  /** Uploaded video file, when it is not. */
  video: string | null;
  poster: string | null;
}
