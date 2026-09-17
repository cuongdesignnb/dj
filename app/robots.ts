import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo/config';

// The public origin is injected at runtime in Docker. Do not bake the builder's
// fallback origin into robots.txt during the image build.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/book-now', '/cart', '/checkout', '/preview', '/draft'],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
