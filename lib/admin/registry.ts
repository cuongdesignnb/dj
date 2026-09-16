// Resource registry: every module resolves to the backend-backed repository.

import { cookies } from 'next/headers';
import { getApiBaseUrl } from './common/config';
import {
  HttpAdminRepository,
  HttpSingletonRepository,
} from './common/repository';
import type { AdminRepository, SingletonRepository } from './common/repository';
import type { ResourceDefinition, ResourceKey, SingletonDefinition, SingletonKey } from './common/resource';
import type { AdminRecord } from './common/types';
import { eventsDefinition } from './events/definition';
import { artistsDefinition } from './artists/definition';
import { productsDefinition } from './products/definition';
import { ordersDefinition } from './orders/definition';
import { discountsDefinition } from './discounts/definition';
import { newsDefinition } from './news/definition';
import { galleryDefinition } from './gallery/definition';
import { mediaDefinition } from './media/definition';
import { partnersDefinition } from './partners/definition';
import { staffDefinition } from './staff/definition';
import { rolesDefinition } from './roles/definition';
import { auditDefinition, faqDefinition, legalDefinition, tasksDefinition } from './support/definitions';
import { aboutContentDefinition, contactContentDefinition, homeContentDefinition } from './content/definitions';
import {
  integrationsDefinition,
  languageSettingsDefinition,
  shippingDefinition,
  siteSettingsDefinition,
  socialSettingsDefinition,
} from './settings/definitions';

type AnyDefinition = ResourceDefinition<AdminRecord>;

export const RESOURCES: Record<ResourceKey, AnyDefinition> = {
  events: eventsDefinition as unknown as AnyDefinition,
  artists: artistsDefinition as unknown as AnyDefinition,
  products: productsDefinition as unknown as AnyDefinition,
  orders: ordersDefinition as unknown as AnyDefinition,
  discounts: discountsDefinition as unknown as AnyDefinition,
  news: newsDefinition as unknown as AnyDefinition,
  gallery: galleryDefinition as unknown as AnyDefinition,
  media: mediaDefinition as unknown as AnyDefinition,
  partners: partnersDefinition as unknown as AnyDefinition,
  staff: staffDefinition as unknown as AnyDefinition,
  roles: rolesDefinition as unknown as AnyDefinition,
  faq: faqDefinition as unknown as AnyDefinition,
  legal: legalDefinition as unknown as AnyDefinition,
  audit: auditDefinition as unknown as AnyDefinition,
  tasks: tasksDefinition as unknown as AnyDefinition,
};

export const SINGLETONS: Record<SingletonKey, SingletonDefinition> = {
  'content-home': homeContentDefinition,
  'content-about': aboutContentDefinition,
  'content-contact': contactContentDefinition,
  'settings-site': siteSettingsDefinition,
  'settings-social': socialSettingsDefinition,
  'settings-languages': languageSettingsDefinition,
  'settings-integrations': integrationsDefinition,
  shipping: shippingDefinition,
};

/** Resources reachable through the generic /admin/[resource] screens. */
export const ROUTED_RESOURCES: ResourceKey[] = [
  'events',
  'artists',
  'products',
  'orders',
  'discounts',
  'news',
  'gallery',
  'partners',
  'staff',
  'roles',
];

export function getResource(key: string): AnyDefinition | null {
  return (RESOURCES as Record<string, AnyDefinition>)[key] ?? null;
}

async function cookieHeader(): Promise<string> {
  return (await cookies()).toString();
}

export async function getRepository(key: ResourceKey): Promise<AdminRepository<AdminRecord>> {
  const definition = RESOURCES[key];
  return new HttpAdminRepository(getApiBaseUrl(), definition.apiPath, await cookieHeader());
}

export async function getSingletonRepository(key: SingletonKey): Promise<SingletonRepository<Record<string, unknown>>> {
  const definition = SINGLETONS[key];
  return new HttpSingletonRepository(getApiBaseUrl(), definition.apiPath, await cookieHeader());
}
