import {
  Box,
  Droplet,
  FileText,
  Gem,
  Globe,
  Heart,
  Music,
  Shirt,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ShopIcon } from '@/lib/shop/types';

/** Data names an icon; this is the only place that knows what it looks like. */
export const SHOP_ICONS: Record<ShopIcon, LucideIcon> = {
  gem: Gem,
  box: Box,
  music: Music,
  globe: Globe,
  shirt: Shirt,
  star: Star,
  heart: Heart,
  users: Users,
  file: FileText,
  droplet: Droplet,
  sparkles: Sparkles,
};

export function shopIcon(name: ShopIcon | null | undefined, fallback: ShopIcon = 'sparkles') {
  return SHOP_ICONS[name ?? fallback];
}
