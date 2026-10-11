# Event content editor and multi-event public pages

Candidate branch: `codex/event-content-multi-event`, based on the production SHA
`04401372daf6f1a5efe5eafb16afa895b409723e` (verified on the aaPanel host on
2026-10-11: clean detached checkout at `/www/wwwroot/destiny-rave`, image built
after that commit, migrations up to `20261003120000_gallery_image_alt_text`).
Production has not been changed or deployed. No migration, schema change, seed,
production SQL or business-flag change is part of this work.

## Problem

Production event `hi-land-perth` (created in Admin after seeding) had no
`tickets:<id>`, `tables:<id>` or `booking:<id>` page-content rows. The Admin
content editors showed only "Page content has not been seeded yet." with no
form, although the API could create the rows. Separately, `/tickets` was
hard-coded to `destiny` and `/tables`/`/book-now` read one event from
`NEXT_PUBLIC_VIP_EVENT_SLUG`, so a second event could never be shown publicly.

## A. Admin content for events created after seeding

- `GET /api/v1/admin/page-content/{tickets|tables|booking}:<eventId>` returns
  `{ id: null, status: 'MISSING', persisted: false, data: <draft> }` when the
  event exists but has no row. The draft (`lib/cms/event-content-template.ts`)
  is neutral copy built from the event title and slug, passes the strict
  page-content schema and contains none of the copy rejected by `cms:audit`.
- The editor shows "Not saved yet" and explains that nothing is stored or
  public until Save draft or Publish. Saving creates the row (audited as
  `create`), reload shows the stored status.
- Unknown, malformed or deleted event IDs return 404 "Event not found." on read
  and write; no row is created. Static page keys keep the old 404.
- Load errors now show the real reason (permission, missing event, network)
  instead of always "not seeded". Save errors show field errors and request ID
  via `ApiErrorNotice`; the Save buttons recover after network failures.
- Field labels are now associated with their inputs (`htmlFor` ↔ `id`).
- Readiness: ticket readiness warns when tickets content is not published and
  both panels show the public URL of the event (`/tickets?event=<slug>`, …).

## B. Event-scoped public pages

- `/tickets`, `/tables`, `/book-now` accept `?event=<slug>`. No parameter (or
  the default slug) keeps the previous default-event page, indexable at the
  same canonical URL. Other events render with `noindex`.
- Malformed or unknown slugs call `notFound()`. These routes stream through
  `loading.tsx`, so Next.js 16 answers with the not-found UI, `noindex` and
  HTTP 200 — the same behaviour `/events/<unknown>` already has.
- Pages without `?event=` keep their previous closed states exactly: an
  unpublished default event still shows "service unavailable" on `/tables`
  and `/book-now` and the original message on `/tickets` (covered by the
  existing post-gallery VIP state test).
- `/tickets?event=` for an event without published tickets content says
  "Ticket information for this event has not been published yet." instead of
  a service error.
- `/events/<slug>` links Get Tickets, VIP and Book Now to its own scoped URLs;
  `destiny` keeps `/tickets`, `/tables`, `/book-now`. The footer Event link
  points to the current event. The VIP configurator carries `event` to
  `/book-now`, and the booking page's Tickets tab returns to the same event.
- Booking submission already sent the event UUID; requests from
  `/book-now?event=<slug>` are stored against that event.

## Verification (local QA only)

Node 24 locally; the QA image builds and runs on Node 22 (`node:22-alpine`).

- `npx tsc --noEmit`: pass.
- `npm run lint`: 0 errors (warnings pre-existing; the only warning in touched
  files is the existing `setLoading` call in the CMS editor effect).
- `npm test`: 113 passed (90 existing + 23 new in `event-content.test.ts`
  and `event-scope-public.test.ts`).
- `npm run cms:audit`: all zero.
- `docker compose -f docker/compose.gallery-qa.yml build app` (Next build on
  Node 22): pass. QA app healthy, Postgres/Redis ready, no pending migrations.
- `tests/e2e/event-content-multi-event.spec.ts` (Chrome, 7 tests): pass. It
  creates the isolated `qa-multi-event`, opens the three editors, checks the
  draft, publishes, reloads, checks API + DB rows + audit, checks viewer 403,
  unknown-event 404s, public pages for the event and for the default event,
  a real booking request stored against the event, event-page links and
  readiness; afterAll removes its content rows/requests and archives it.
- SEO scripts against QA: `seo:audit`, `seo:redirects:check`,
  `seo:sitemap:check` pass. `seo:route-matrix` stops at `/gallery/destiny`
  (expected 404, got 200) — pre-existing since `b0834d8` added
  `app/gallery/[slug]/loading.tsx`; this branch does not touch Gallery. All
  routes before it, including `/tickets`, `/tables` and `/book-now`, pass.
- Full E2E suite (Chrome, `GALLERY_QA=1`, 22 tests: event content, Gallery
  albums, launch smoke, post-gallery UAT, VIP package admin): 22 passed.
  Earlier runs on the same day hit the QA login limit (5/10 min) and booking
  limit (10/hour per IP) after repeated runs; only those three exact QA keys
  were deleted from the isolated QA Redis before the final run. One real
  regression found on the way (unpublished default event showed
  `event-not-found` instead of `service-unavailable`) was fixed before it.
- Visual check in the browser against QA: the editor banner and draft, the
  stored PUBLISHED status after reload, and `/tickets?event=qa-multi-event`
  showing the event, its tier and the event CTA. QA data was cleaned up.

Known pre-existing issue, not changed here: page titles repeat the site name
(`DESTINY Tickets | Connection Rave | Connection Rave`) on every page.

## After deployment (separate approval)

No data is created by the deployment. To make `hi-land-perth` public, an
editor opens Admin → Events → Hi-Land Perth → Tickets content, VIP tables
content and Booking content, reviews the drafts and publishes them, then shares
`/tickets?event=hi-land-perth`, `/tables?event=hi-land-perth` and
`/book-now?event=hi-land-perth` (or the links on `/events/hi-land-perth`).
Rollback: redeploy `0440137` with the same env/volumes; content rows created
in Admin are ordinary page-content rows and remain valid for the old code.
