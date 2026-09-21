# Launch readiness

Run date: 2026-09-21
Repository: `cuongdesignnb/dj`
Last smoke source: `1f7f380a888003edaf57004619171bb3dc57b436` plus the uncommitted warning-cleanup changes being validated in this run.

## Production configuration

| Item | State |
| --- | --- |
| Production domain | NOT_SUPPLIED; current `APP_URL` is local Docker `http://localhost:43171` |
| `APP_URL` / `NEXT_PUBLIC_SITE_URL` | Not production-configured; HTTPS domain is required before launch |
| SEO indexing | OFF (`SEO_INDEXING_ENABLED` is unset/false locally) |
| Canonical / sitemap | Local QA passes with noindex; production origin must be supplied and rechecked |
| Square | SANDBOX NOT_CONFIGURED; access token, application ID, location ID and webhook signature key are empty |
| Legal | Terms and Privacy are DRAFT and remain API-gated |

## Launch scope

Intended core scope is the published DESTINY event, artists, partners, FAQ, contact/newsletter and VIP request flow. The event date/schedule and ticket sale state still require Owner confirmation before ticket sales are enabled.

## Enabled modules in the current build

- Homepage hero and event detail
- Published artist lineup
- Published partners and FAQ
- VIP request-only flow
- Contact and newsletter API forms
- Admin event/content/settings workflows

## Disabled or gated modules

- Square checkout and provider webhook finalization (external configuration missing)
- Online ticket purchase (`availability=UNKNOWN`, `purchasableOnline=false`)
- Published merchandise, news and gallery catalogue (records are preview-only)
- Public past-event history (no approved verified records)
- Terms and Privacy publication (draft approval missing)
- Search indexing (production domain and final content are not ready)

## Verification summary

- Docker app, Postgres and Redis are healthy.
- Public and admin Chrome smoke routes render without an unexplained load error.
- Seed verification passes; QA smoke events and canary contact/newsletter rows are absent.
- Lint is green with 93 non-blocking warnings after safe cleanup.
- Production readiness remains `NO` until the external and Owner-owned inputs above are supplied.

## Required owner handoff

Supply the production HTTPS domain, Square sandbox configuration, confirmed DESTINY date/schedule/ticket state, real launch content, contact/social values and approved Terms/Privacy. Do not enable `SEO_INDEXING_ENABLED=true` or submit a sitemap before those checks pass.
