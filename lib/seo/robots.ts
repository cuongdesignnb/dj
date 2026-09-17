import type { MetadataRoute } from 'next';
import { siteUrl } from './config';

export const PRIVATE_ROBOT_PATHS = ['/admin', '/api', '/book-now', '/cart', '/checkout', '/preview', '/draft'];

export function buildRobots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_ROBOT_PATHS,
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
