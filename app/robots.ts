import type { MetadataRoute } from 'next';
import { buildRobots } from '@/lib/seo/robots';

// The public origin is injected at runtime in Docker. Do not bake the builder's
// fallback origin into robots.txt during the image build.
export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots { return buildRobots(); }
