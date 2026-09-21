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

export interface HomeTicketTier {
  id: string;
  name: string;
  price: string;
  badge: string | null;
  features: string[];
  purchasableOnline: boolean;
  purchasableAtDoor: boolean;
  availabilityStatus: string;
}

export interface HomeTrustItem {
  icon: 'ShieldCheck' | 'BadgeCheck' | 'Users';
  title: string;
  description: string;
}

export interface HomeBoothPackage {
  name: string;
  price: string;
  people: string;
  bottles: string;
  choices: string[];
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
