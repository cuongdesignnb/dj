import type { NextRequest } from 'next/server';
import { getFeaturedEventSlug } from '@/server/services/featured-event';

export const dynamic = 'force-dynamic';

/**
 * /event always opens the current event chosen in Admin (Homepage › Hero ›
 * Current event). Temporary, so changing the current event takes effect at once.
 * The Location is relative: behind the reverse proxy `request.url` is the
 * container's internal address (http://localhost:3000), not the public site.
 */
export async function GET(request: NextRequest) {
  const slug = await getFeaturedEventSlug();
  return new Response(null, { status: 307, headers: { Location: `/events/${encodeURIComponent(slug)}${request.nextUrl.search}`, 'Cache-Control': 'no-store' } });
}
