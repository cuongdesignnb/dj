import { NextResponse, type NextRequest } from 'next/server';
import { getFeaturedEventSlug } from '@/server/services/featured-event';

export const dynamic = 'force-dynamic';

/**
 * /event always opens the current event chosen in Admin (Homepage › Hero ›
 * Current event). Temporary, so changing the current event takes effect at once.
 */
export async function GET(request: NextRequest) {
  const slug = await getFeaturedEventSlug();
  const target = new URL(`/events/${encodeURIComponent(slug)}`, request.url);
  target.search = request.nextUrl.search;
  return NextResponse.redirect(target, 307);
}
