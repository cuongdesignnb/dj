import {
  Camera,
  Clock,
  Globe,
  Headphones,
  IdCard,
  Info,
  MapPin,
  Music,
  Shirt,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wine,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  camera: Camera,
  clock: Clock,
  globe: Globe,
  headphones: Headphones,
  idcard: IdCard,
  id: IdCard,
  info: Info,
  mappin: MapPin,
  music: Music,
  shirt: Shirt,
  shieldcheck: ShieldCheck,
  sparkles: Sparkles,
  ticket: Ticket,
  users: Users,
  wine: Wine,
  zap: Zap,
};

/** Resolves an icon key from Admin ("Music", "map-pin", "IdCard") to an icon; unknown keys get a sparkle. */
export function featureIcon(key: string | null | undefined): LucideIcon {
  return ICONS[(key ?? '').toLowerCase().replace(/[^a-z]/g, '')] ?? Sparkles;
}
