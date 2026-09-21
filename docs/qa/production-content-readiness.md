# Production content readiness

QA run: 2026-09-21
Environment: Docker Compose (`destiny-app`, PostgreSQL, Redis) with Chrome at `http://localhost:43171`.

This document separates technical availability from editorial approval. A seeded row is not treated as production-ready merely because it exists in PostgreSQL. Preview/draft rows remain gated, and unknown event facts remain `TBA`/`TBC`.

| Domain | Current source state | Public/client behavior | Gate |
| --- | --- | --- | --- |
| Event core | `DESTINY` is the one published event; venue and event graph are real and complete | Hero, detail, ticket and VIP routes render the persisted event | PASS for core event data; date/schedule still `TBA`/`TBC` |
| Event media and hero | Canonical media exists; legacy `/public/assets/...` DB rows are inactive | Original hero artwork and sponsor presentation render | PASS |
| Artists / lineup | 8 published artists with translations and media | Homepage and lineup routes render the seeded artists | PASS |
| Ticket catalogue | 3 real tiers with server prices; availability is `UNKNOWN`; `purchasableOnline=false` | Prices render, but checkout intent rejects unavailable tiers | BLOCKED_CONTENT_APPROVAL |
| VIP / tables | 1 request-only package, 17 current event booths and 6 bottles; event API round-trip preserved the related graph | Tables and booking request routes render; payment is not claimed | PASS for request flow; payment blocked externally |
| Partners / sponsors | 2 published partners plus bundled brand assets | Homepage/footer/partners render real persisted partner data | PASS |
| Products / merchandise | 6 preview products (7 admin records including the preview state); no published public products | `/shop` shows a truthful empty catalogue; no checkout success is fabricated | BLOCKED_CONTENT_APPROVAL |
| News | 1 preview article; no published public article | `/news` remains an explicit empty/preview-safe state | BLOCKED_CONTENT_APPROVAL |
| Gallery | 2 preview albums; no published public album | `/gallery` remains an explicit empty/preview-safe state | BLOCKED_CONTENT_APPROVAL |
| Past events | Archived QA/seed history is not a published public programme; smoke rows were deleted | No invented past-event copy is exposed | BLOCKED_CONTENT_APPROVAL |
| FAQ | Seeded FAQ content is available through the public endpoint | `/faq` renders the public FAQ state | PASS |
| Terms | Legal document exists but is draft and API-gated | `/terms` renders draft-safe state; it is not presented as approved terms | BLOCKED_CONTENT_APPROVAL |
| Privacy | Legal document exists but is draft and API-gated | `/privacy` renders draft-safe state; it is not presented as approved policy | BLOCKED_CONTENT_APPROVAL |
| Contact / newsletter | Contact and newsletter endpoints are live; canaries returned expected `202`/`422` responses and were cleaned | Forms have real API targets and no dead CTA fallback | PASS |
| Social / footer | Persisted social settings are empty; empty links are omitted | No `#` placeholders or invented social URLs | PASS; configure approved links before campaign launch |
| SEO production config | Local Docker intentionally has `SEO_INDEXING_ENABLED=false`; `APP_URL` is localhost | Robots/noindex and empty local sitemap are safe for QA | BLOCKED_CONFIG until production HTTPS URL and indexing decision are supplied |

## Approval checklist before launch

- Approve and publish the event date, schedule, ticket availability and online-sales flags.
- Review and publish Terms and Privacy translations.
- Decide which products, news, gallery and past-event records are in launch scope; publish only approved records.
- Provide Square sandbox credentials/location/webhook configuration, run the provider-backed sandbox flow, then repeat with production credentials under the deployment change process.
- Set production `APP_URL` and the explicit SEO indexing flag only after the domain is ready.

No content or legal approval is inferred from the seed data. This is why the technical QA result can pass while `PRODUCTION_READY` remains `NO`.
