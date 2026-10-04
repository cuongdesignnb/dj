# Post-Gallery UAT fix and deployment handoff

Baseline: `codex/gallery-album-save` at
`53f113c57305a9c615f87396e42bc705ba1731ef`.
Candidate: `codex/post-gallery-uat` (use its verified pushed HEAD for deployment).
Production deployment is NOT performed or authorized by this task.

## Root causes and fixes

VIP API correctly returned disabled configuration with empty packages/booths.
The old repository selected packages[0] and fed a package-required normalizer,
turning that valid state into an invalid-payload error. The new typed classifier
evaluates feature/configuration states before requiring interactive package
data; actual malformed money/event/JSON and service failures remain distinct.
Server logs use reason codes and do not include booking PII.

The form also sent packageId instead of vipPackageId and read the wrong success/
error envelopes. It now matches the actual API, handles structured field errors,
enforces capacity, guards rapid re-submit and only displays received for
RECEIVED. The service requires a published event and an enabled event-owned
package, checks VIP/booking flags, booth availability, package-owned bottles
and count/capacity, then atomically stores the request/bottles. Preferred booth
may be null only for REQUEST_ONLY event + REQUEST_ONLY package. This confirms
the existing request-only use case, not a reservation or new payment policy.

Unlinked Gallery detail previously used eventHref ?? '/event'; that alias
redirects to DESTINY. The fallback is removed; event CTA exists only for a valid
published, non-deleted linked event. Gallery caches also depend on event tags.
Catalogue cards precede the preview and show derived counts. CMS keys:
`albums` (catalogue), `gallery` (preview), `featured` (optional featured block).
At /admin/content/gallery use the visual Page sections cards to add/edit these
keys, title/context and Show this section; Hero, Media Library, CTA and SEO
remain visual controls. No raw JSON entry or automatic production seed needed.

Admin VIP/Ticket settings now have read-only readiness counts, toggles, content
statuses and actionable warnings. Tickets zero-tier state uses CMS wording.
No production feature flag, package, ticket price or Square setting changed.

Navigation uses one thin nonblocking progress bar on internal Link intent,
persists while loading boundaries are mounted, clears on completion and has a
30-second failure safety cutoff. Reduced-motion disables animation. Public
links share the wrapper; admin editing behavior is unchanged. Lightweight
skeletons cover all nine requested priority routes.

Seed transaction timeout is now source controlled (maxWait 10s, timeout 120s).
No production seed was run. No new migration is required; retain existing
`20261003120000_gallery_image_alt_text`, already applied in isolated QA.

## Evidence and repeatable checks

- `docs/qa/post-gallery-production-before.json`: initial allowed GET responses.
- `docs/qa/post-gallery-data-freeze.json`: exact content-body comparison, IDs/counts and 24 asset hashes/size/statuses.
- `docs/qa/post-gallery-performance.json`: measured cold/warm HTTP, server API durations, browser timing and lazy/responsive image attributes.
- `docs/qa/public-menu-readiness.md` and `public-page-readiness.md`: owner/configuration vs engineering gates.
- `tests/unit/vip-state.test.ts`, `booking-contract.test.ts`: classifier/HTTP/client validation and mocked service contract tests.
- `tests/e2e/post-gallery-uat.spec.ts`: real Chrome/PostgreSQL/Redis state, menu, request, CTA, CMS visibility, loading and performance tests.
- `tests/e2e/gallery-albums.spec.ts`: real admin form and persistence/security/media regression.

Use isolated compose ONLY for fixtures:

```powershell
docker compose -f docker/compose.gallery-qa.yml build app
docker compose -f docker/compose.gallery-qa.yml up -d
# Existing QA preview/account fixtures must exist; never use a production DB URL.
Get-Content tests/fixtures/gallery-qa.mjs -Raw | docker compose -f docker/compose.gallery-qa.yml exec -T app node --input-type=module
$env:GALLERY_QA='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:43291'
$env:PLAYWRIGHT_CHANNEL='chrome'
npx tsc --noEmit
npm run lint
npm test
npm run test:e2e
```

Fixtures validate GALLERY_QA, DB name/hostname and loopback port. They restore
event/package/booth/tier/CMS/menu-location snapshots in afterAll and soft-archive
their albums; files are not uploaded/deleted. A killed process can interrupt
cleanup, so inspect QA state before re-running. Repeated runs within the login/
booking rate windows may require waiting or clearing ONLY verified rate keys in
the isolated QA Redis, never production or a global security setting.

## Measurements (not a cross-environment speed claim)

Production baseline three GETs each: Tables TTFB 0.250–0.632s, full response
0.277–0.632s; Book Now TTFB 0.215–0.252s, full 0.269–0.278s; Gallery TTFB
0.265–0.347s, full 0.374–0.414s. Tables/Book Now were the old error state.

Isolated Node22 candidate, VIP_DISABLED fixture: final full-suite curl probe
measured streamed TTFB 7–14ms, full responses 8–32ms. Browser Gallery TTFB
12.9ms, response 17.4ms, DOMContentLoaded 83.9ms. Cold/warm logs show one event
request, one VIP request and one Gallery request across nine HTML requests;
repeated page + metadata reads reuse 300-second tagged cache entries.
API service durations in that probe were 1–12ms. These are local measurements,
not a precise isolated SSR CPU profile or a promise of production improvement.

The 24 production originals total 44,251,775 bytes; largest 8,092,564 bytes.
Candidate limits preview to six lazy thumbnails, keeps responsive Next raster
srcset/sizes, leaves scalable SVGs unoptimized as Next intends, and removes
below-fold preview preload. No originals, ALT or captions were rewritten.
Slow navigation is reproducibly tested with a 1.5s delayed RSC response on
desktop/mobile; exactly one progress indicator appears and clears.
No evidence warranted an infrastructure/architecture rewrite.

## Deployment — separate approval required

1. Confirm approved candidate SHA from `git rev-parse origin/codex/post-gallery-uat`
   and verify it includes the Gallery baseline. Preserve the current baseline
   image and deployment configuration for rollback.
2. Take a verified PostgreSQL backup and snapshot/back up the media volume.
   No additive migration in this candidate; nevertheless confirm the existing
   Gallery alt-text migration remains applied. Do not reset or seed.
3. On the existing approved production Docker host/check-out, use its current
   .env.docker and Compose project/ports (do not copy the QA compose or credentials).
   Build via `docker compose --env-file .env.docker -f docker-compose.yml build app`.
   Dockerfile runs prisma generate and npm run build. Use an LF checkout for
   docker/entrypoint.sh; do not change secrets/indexing/provider settings.
4. Deploy only the app:
   `docker compose --env-file .env.docker -f docker-compose.yml up -d --no-deps app`.
   Existing entrypoint runs prisma migrate deploy unless migrations were
   explicitly disabled; if disabled, apply migrate deploy with the approved
   image as in the existing deployment procedure.
5. Verify GET /api/health and /api/health/ready (Postgres/Redis healthy), logs
   without errors, then the eight allowed public baseline endpoints.
6. Read-only post-deploy Chrome: Tables/Book Now direct/menu/reload show the
   controlled disabled state; Tickets clean coming-soon; Gallery catalogue
   shows DESTINY 15/ECHO 9, preview label clear, ECHO has no /event CTA, DESTINY
   links only to its published event. Check desktop/mobile loading/reduced
   motion, legal draft labels, and News/Shop empty states.
7. Compare Gallery IDs/placements/order/ALT/captions/asset hashes against the
   freeze proof. No disposable production album, booking or payment is needed.
   Change production menu/configuration only after BA/owner approval.

Rollback: redeploy the saved image/source at
`53f113c57305a9c615f87396e42bc705ba1731ef` with the existing env/volumes.
No database downgrade/reset is needed for this candidate (no new migration).
Do not remove the prior Gallery alt-text column/migration. Do not claim the old
VIP/ECHO bug is absent after rolling back to that baseline.

Owner gaps (News/Shop, legal, contacts/providers, ticket/VIP configuration and
menu ordering) are not fabricated engineering PASS results. A fresh read-only
`npm audit --json` reports 22 findings (5 moderate, 15 high, 2 critical), tracked
separately from the scoped UAT bug gates. They remain a release-security review
item; no dependency upgrades or audit fix were performed. No production writes,
test bookings or payments were performed.

## Final verification — 2026-10-04

| Check | Result |
| --- | --- |
| TypeScript (`npx tsc --noEmit`) | PASS |
| ESLint (`npm run lint`) | PASS: 0 errors, 121 nonblocking warnings |
| Unit (`npm test`) | PASS: 54 tests in 6 files |
| Production build (`npm run build`, isolated Node22 Docker) | PASS: Next16.2.9 optimized build |
| Chrome + real QA DB/Redis (`npm run test:e2e`) | PASS: 11 tests, 1.3 minutes |
| Existing Gallery alt-text migration | Applied in QA; no new migration |
| Production public content before/after | All 6 content endpoint bodies identical; health endpoints both 200 |
| DESTINY / ECHO | Same IDs, 15 / 9 placements, same order/ALT/captions |
| Referenced Gallery media | 24 / 24 HTTP200, identical SHA256 and bytes |
| Production writes / test bookings / test payments | 0 / 0 / 0 |

Application build SHA256:
`bdfb77f0976444babb656a360bfc6c60af8b1e310166d9590182863c2dc5b314`.
Only test capture readiness and documentation changed after that build; the
complete Chrome suite and TypeScript/lint/unit checks were rerun on final source.
Screenshots are isolated QA fixtures, not production album content. Production
still runs its previous code until a separately approved deployment. The 24
asset count is Gallery-scoped, not a claim about the entire Media Library.

P0/P1/P2 scoped engineering bugs: 0 open on the candidate. BA/menu exposure,
content/provider/configuration and the separate dependency audit remain owner/
release decisions; their readiness statuses are in the two matrices.

## Changed-file manifest

107 files compared with the starting Gallery baseline. Many public UI files
have only the shared navigation Link import substitution; no primary menu items
or order are hardcoded. Original D:/DJ/destiny-rave local modifications were
not included in this managed worktree branch.

```text
app/api/v1/[...path]/route.ts
app/book-now/error.tsx
app/book-now/loading.tsx
app/book-now/page.tsx
app/event/error.tsx
app/event/not-found.tsx
app/events/error.tsx
app/events/loading.tsx
app/events/past/error.tsx
app/faq/error.tsx
app/gallery/[slug]/loading.tsx
app/gallery/[slug]/not-found.tsx
app/gallery/[slug]/page.tsx
app/gallery/error.tsx
app/gallery/loading.tsx
app/gallery/page.tsx
app/globals.css
app/layout.tsx
app/lineup/[slug]/not-found.tsx
app/lineup/error.tsx
app/lineup/loading.tsx
app/news/[slug]/not-found.tsx
app/news/error.tsx
app/news/loading.tsx
app/privacy/error.tsx
app/shop/[slug]/not-found.tsx
app/shop/error.tsx
app/shop/loading.tsx
app/tables/error.tsx
app/tables/loading.tsx
app/tables/page.tsx
app/terms/error.tsx
app/tickets/error.tsx
app/tickets/loading.tsx
app/tickets/verify/page.tsx
components/about/AboutEcosystem.tsx
components/about/AboutPartners.tsx
components/about/AboutValues.tsx
components/admin/cms/EventReadiness.tsx
components/admin/cms/EventSettingsEditor.tsx
components/artists/ArtistCard.tsx
components/artists/ArtistProfile.tsx
components/cart/CartClient.tsx
components/cart/CartItem.tsx
components/cart/OrderSummary.tsx
components/checkout/ResultActions.tsx
components/event/Breadcrumb.tsx
components/event/EventActionButton.tsx
components/event/EventFooter.tsx
components/events/EventAction.tsx
components/events/EventsBreadcrumb.tsx
components/events/EventsFooter.tsx
components/gallery/CollectionView.tsx
components/gallery/FeaturedCollection.tsx
components/gallery/GalleryMosaic.tsx
components/gallery/RelatedCollections.tsx
components/home/Header.tsx
components/home/LineupPreview.tsx
components/home/NeonButton.tsx
components/news/ArticleSidebar.tsx
components/news/NewsBrowser.tsx
components/news/NewsCard.tsx
components/partners/FeaturedPartners.tsx
components/partners/PartnersHero.tsx
components/shared/FinalCtaSection.tsx
components/shared/ListingEmptyState.tsx
components/shared/NavigationFeedback.tsx
components/shared/PageHero.tsx
components/shared/PublicMenuLinks.tsx
components/shared/PublicRouteLoading.tsx
components/shop/AddToCartButton.tsx
components/shop/CartButton.tsx
components/shop/ProductCard.tsx
components/shop/ProductInfo.tsx
components/shop/ShopCatalog.tsx
components/shop/ShopHero.tsx
components/support/FaqBrowser.tsx
components/tickets/TicketsSelector.tsx
components/vip/BookingRequestForm.tsx
components/vip/GroupSizeControl.tsx
components/vip/VipConfigurator.tsx
components/vip/VipInfoGrid.tsx
components/vip/VipStateNotice.tsx
docs/qa/post-gallery-data-freeze.json
docs/qa/post-gallery-handoff.md
docs/qa/post-gallery-performance.json
docs/qa/post-gallery-production-before.json
docs/qa/public-menu-readiness.md
docs/qa/public-page-readiness.md
lib/gallery/repository.ts
lib/tickets/repository.ts
lib/vip/http.ts
lib/vip/page.ts
lib/vip/repository.ts
lib/vip/types.ts
lib/vip/validation.ts
prisma/seed.ts
prisma/seeds/15-cms.ts
server/services/cms.ts
server/services/leads.ts
tests/e2e/gallery-albums.spec.ts
tests/e2e/post-gallery-uat.spec.ts
tests/fixtures/post-gallery-qa.mjs
tests/unit/booking-contract.test.ts
tests/unit/server-only.ts
tests/unit/vip-state.test.ts
vitest.config.ts
```
