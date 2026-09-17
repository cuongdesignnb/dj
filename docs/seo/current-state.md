# SEO current state (baseline)

Captured before the SEO completion work on 2026-09-17.

## Route inventory

Public route families present at baseline:

- `/`, `/about`, `/partners`, `/events`, `/events/past`, `/event`, `/tickets`, `/tables`, `/lineup`, `/lineup/[slug]`.
- `/gallery`, `/gallery/[slug]`, `/news`, `/news/[slug]`, `/shop`, `/shop/[slug]`, `/faq`, `/book-now`, `/cart`, `/checkout/result`.
- `/terms`, `/privacy`, and `/admin/*`.
- `/api/*` and `/assets/*` are service routes, not indexable pages.

## Baseline metadata/indexability

- `app/layout.tsx` had a static title/description and a `metadataBase` fallback that could resolve to localhost.
- Several public pages exported local static metadata instead of resolving SEO fields from database/API content.
- Dynamic detail pages had partial metadata, but no shared metadata/canonical/indexability helpers.
- No checked-in `app/robots.ts` or dynamic `app/sitemap.ts` existed at baseline.
- Structured data, where present, was route-local and not covered by a parse/audit gate.
- Preview, draft, cart, checkout, booking, admin, and thin profiles did not have one audited global policy.
- Legacy `/event` was not verified as a one-hop permanent migration to `/events/destiny`.

## Hardcoded/runtime content findings

- Repositories contained presentation fallbacks and placeholder copy that needed an explicit distinction between neutral UI copy and business data.
- The seed published preview products, news, and gallery data, which could make design concepts indexable.
- No automated scan asserted zero runtime mock repositories, hardcoded business records, fake dates, or fake inventory.

## Required target

Centralize SEO configuration and helpers, connect metadata/sitemap/schema to published DB/API records, make preview/draft content noindex and absent from sitemap, add robots and redirect checks, and create an automated audit covering representative routes, links, JSON-LD, canonicals, and indexability.
