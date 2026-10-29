# Page titles, partner copy and the rich text editor

Candidate branch: `codex/title-and-rich-text`, based on the production SHA
`31e78a64f319e7a4ecb31d7bf4ea53d9bb188156` (deployed 2026-10-11). No
migration, schema change, seed or business-flag change.

## 1. Page titles named the site twice

The root layout title template is `%s | Connection Rave`, while
`buildMetadata` titles (and several CMS/SEO titles stored in the database)
already end with `| Connection Rave`. Every public page rendered e.g.
`Gallery | Connection Rave | Connection Rave`; admin pages without their own
title rendered `Admin — Connection Rave | Connection Rave`.

`brandTitle()` / `siteTitle()` in `lib/seo/config.ts` name the site exactly
once: a title that already contains "Connection Rave" is kept, any other gets
` | Connection Rave`. `buildMetadata` returns it as `title.absolute`, so the
template cannot repeat it; checkout, ticket verification and the legacy
`/event` route use `siteTitle()`. The admin layout default is absolute.
Stored titles are not rewritten.

## 2. Partner edit blanked tagline and description

The partner admin record never returned `tagline`/`description`, so opening a
partner in Admin and saving it wrote both as null. They are now loaded back.

## 3. Rich text editor for long copy

Before: every long field was a plain `<textarea>`; no public page kept line
breaks, so typed paragraphs ran together.

Libraries (MIT, pinned): TipTap `@tiptap/core`, `@tiptap/react`,
`@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/markdown` 3.31.3 (released
2026-09-04) for the admin editor; `react-markdown` 10.1.0 for public
rendering. `npm audit --omit=dev` is identical before and after.

Storage stays a string in the existing columns: a small Markdown subset
(paragraphs, Shift+Enter line breaks, bold, italic, links, bulleted/numbered
lists, small headings). Old plain text is valid input and renders the same.
No HTML is stored or rendered: `components/shared/RichText.tsx` turns Markdown
into React elements with an element allow-list, `skipHtml` and
react-markdown's unsafe-protocol filter; the editor only accepts `https://`,
`mailto:`, `tel:` and site paths for links. Meta descriptions, Open
Graph/Twitter text, every JSON-LD description/FAQ answer, the admin FAQ list
preview and listing cards use `richTextToPlain()`.

Editors (`components/admin/form/RichTextEditor.tsx`): full mode (lists and
small headings) or inline mode (bold, italic, links). Character counters and
max-length checks count visible text.

| Admin field | Mode | Public rendering |
| --- | --- | --- |
| Event long description | full | Event About + Venue, home hero/overview, featured event |
| Event short description | inline | Event hero, home overview; plain text on past-event cards and meta |
| Artist biography | full | Artist profile (and admin detail view) |
| Gallery description | full | Collection page, featured collection |
| Partner description | inline | Featured partners, About partners |
| Product excerpt | inline | Product page |
| FAQ answer (FAQ manager) | full | `/faq`; plain text in FAQ JSON-LD and admin list |
| Ticket tier description | inline | Ticket option cards |
| VIP package description | full | VIP configurator |
| News paragraph blocks | inline | Article body |
| CMS page content: hero/selector/map/form descriptions, empty-state, provider note, footer description | inline | Heroes, selector, club map, ticket panel, footers |
| CMS info/trust cards and FAQ answers | full | Info grids, FAQ accordions |
| CMS process steps, CTA subtitles, listing empty states | inline | Booking steps, final CTA sections, empty states |

Kept plain on purpose: SEO meta descriptions, news excerpts, section context
labels (rendered as uppercase labels), and fields that are not shown publicly.

## Verification

See the task report for the run on this branch: typecheck, lint, unit tests
(`seo-title`, `rich-text` plus all existing), `cms:audit`, Docker build on
Node 22, and the GALLERY_QA E2E suite including `rich-text-editor.spec.ts`
(toolbar formatting → save → reload → API → public page and meta tags).

## Rollback

Redeploy `31e78a6` with the same env/volumes. Content saved with formatting
stays valid text; the old code shows the Markdown marks literally (e.g.
`**bold**`) until it is redeployed or the text is edited back.

## 4. Ticket tiers and ticket settings

The tier editor showed "Price minor units" (cents) and a free-text
Availability box; any value other than the exact API code made the server throw
(HTTP 500, "Something went wrong"). Now (`components/admin/cms/TicketTierFields.tsx`,
`lib/admin/events/tickets.ts`):

- price is entered in dollars with a live "Shown as AUD 45.00" preview;
- availability, sale status and VIP payment mode are labelled selects;
- badge, capacity, min/max/pre-selected quantity and display order are editable;
- the API validates with field messages (422) instead of throwing, accepts
  seeded database UUIDs, and checks min ≤ max ≤ capacity;
- editing a field clears its own error; deleting a tier/package/booth/bottle
  asks for confirmation;
- the ticket sale window loads back into the date inputs and is saved as an
  ISO instant from the editor's local time; a closing time before the opening
  time is refused on the field.

## 5. Site-wide toasts

`components/shared/toast/ToastProvider.tsx` serves both the public site (root
layout, bottom-left, rave theme) and the admin (admin theme, bottom-right). It
announces through polite/assertive live regions and is rendered inside the
open modal dialog when there is one, so admin toasts are no longer hidden or
inert behind drawers.

Public actions now confirm with a toast in addition to their inline messages:
add to cart, remove from cart, promo code, booking request, VIP/ticket/cart
checkout failures, contact form, newsletter and copy link. The contact form
also had a real bug: it reset the form through `event.currentTarget` after an
await (null by then), so a sent message was reported as "could not be reached".

Admin: media picker upload success/failure, media upload failure and empty
menu creation now toast; save/delete/duplicate/archive in data tables, media,
FAQ, menus, menu locations, orders and integrations recover from network
failures with an error toast instead of hanging. A Square refund now needs
confirmation.

## 6. Admin guided tour

`driver.js` 1.8.0 (MIT, no dependencies) drives page tours defined in
`lib/admin/tour/tours.ts`: admin overview (dashboard), event editing, ticket
tiers, ticket settings, page content editors and the media library. A tour
opens automatically the first time an editor visits that kind of page, every
step has "Skip tour", and Escape/close also skip. Progress is remembered per
admin user in this browser (`connection-rave:admin-tour:v1:<userId>`). The
"Guide" button in the top bar replays the tour for the current page (or the
general overview). Steps whose element is not on the page are dropped before
the tour starts. Automated browsers (E2E) never get tours unless a test opts
in, so existing suites are unaffected.

Verification for sections 4–6 on QA: typecheck, lint 0 errors (118 existing
warnings), 157 unit tests, `cms:audit` 0, Docker build, and the full E2E suite
30/30 including `ticket-tiers.spec.ts` and `toast-and-tour.spec.ts`.

## 7. Logo and favicon from Admin › Settings › Site

The logo and favicon saved in Settings › Site were stored (`site.logo`,
`site.favicon`) but never read: the header, home VIP section and SEO data used
the bundled `/assets/logo-connection.svg`, the six public footers showed a
"C · CONNECTION" text mark, and the favicon was the `app/favicon.ico` file
convention. `server/services/branding.ts` now reads them (cached on the
`public:site` tag that saving Settings already revalidates, with a safe
fallback when the database is unreachable) and the root layout provides them
to `SiteLogo` in the header, VIP section and all footers, to the favicon and to
the Organization JSON-LD. Only site paths and https URLs are accepted.
`app/favicon.ico` moved to `public/favicon.ico` so the chosen favicon is not
overridden; `/favicon.ico` still serves the default. E2E: `site-branding.spec.ts`
(7 public pages; restore reverts immediately). Full suite 32/32.

## 8. Sponsor logos from Admin › Partners

New SVG artwork (text outlined, no webfonts, no scripts) in `public/assets`:
`logo-bihi.svg` (redrawn, horizontal), `logo-bi-hair.svg`, `logo-vina9.svg`,
plus full and light-background versions under `public/assets/sponsors/`.
`logo-mcq.svg` is unchanged.

Every sponsor slot now shows the published partners that have a logo, in
Admin order (featured, sort order, then creation): the home hero, the home VIP
block (first sponsor), the home footer strip, the shared footer on FAQ, legal,
events, tickets, gallery and news pages, and the event page footer. The list
comes from `server/services/sponsors.ts` (cached on `public:partners`, which
saving a partner already revalidates) through the root layout. Logos render as
plain `<img>` (`PartnerLogo`) so SVGs from the media library work; the
`/partners` and `/about` logos use the same component. `GET /api/v1/partners`
now returns the partner id (it used to be overwritten by the translation id)
and hides soft-deleted media.

Seeding (`prisma/seeds/16-sponsors.ts`, also part of `db:seed`):

    npx tsx prisma/seed-sponsors.ts --dry-run   # shows changes, rolls back
    npx tsx prisma/seed-sponsors.ts             # npm run db:seed:sponsors

It creates missing media rows and the Bi Hair / VINA9 partners, and on MCQ and
BIHI fills only an empty logo or tagline ("Powered by", "Presented by"). It
never deletes and never changes status, order or names set by an editor; a
second run reports 0 changes. A raw database write does not revalidate the
public cache (up to 5 minutes), so on a running server seed before starting the
new container, or save the partner once in Admin.

QA: seeded the QA DB from the production-like state (MCQ/BIHI without logos):
dry run 16 changes rolled back, run 16 changes, repeat 0. `sponsor-logos.spec.ts`
(5 tests: files served as SVG, every slot in order and decoded in Chrome,
unpublish in Admin removes VINA9 everywhere and Publish restores it). Full suite
37/37 (run the sponsor spec separately or clear the QA login keys: it adds a
sixth qa-admin login).

## 9. Event setup status in Admin and "Fix this in Admin" links

Owners could not tell why `/tickets` said "Ticket information is being
prepared." or `/tables` said "VIP package details are being prepared.": the
Ticketing and VIP / Tables screens only listed events with plain buttons.

`lib/admin/events/setup-status.ts` turns the facts the readiness endpoint
already gathers into an English checklist, evaluated in the same order the
public pages decide what to show (event published → page content published →
enabled tiers; VIP: event → VIP enabled → Tables/Booking content → an enabled
package and a usable default → booths/booking as warnings). Each failing step
says what visitors currently see and links to the exact Admin screen.
`GET /api/v1/admin/events/:id/{tickets|vip}/readiness` now also returns
`status` (existing `facts`/`warnings` unchanged).

- Ticketing / VIP / Tables landing: every event card shows "Live on site" or
  "Not showing yet — <first missing step>" with the fix button.
- Ticket Settings / VIP Settings: the readiness panel shows the same checklist;
  the raw facts and warnings moved under "Technical details".
- Public empty states (tickets, VIP tables/book now, lineup, events, past
  events, gallery, news, shop, FAQ) show "Fix this in Admin" style links only
  to browsers signed in to Admin. Visitors without the admin CSRF cookie never
  call `/api/v1/auth/session`.

E2E: `admin-setup-status.spec.ts` (own `qa-setup-status` event via
`tests/fixtures/setup-status-qa.mjs`, signed in as qa-editor).

## 10. Branded 404 and link aliases

`app/not-found.tsx` replaces Next's bare "This page could not be found" for
unmatched URLs and for notFound() outside segments with their own page
(news/gallery/lineup/shop/event keep theirs). It has the site header and
footer, "Back to home" / "See events" and quick links; Next adds `noindex` to
404 responses. On a 404 whose path contains capitals (phone autocorrect,
"/Tickets"), the page retries once in lowercase.

`next.config.ts` adds temporary (307) redirects for common guesses, keeping the
query string: /home, /index.html → /; /ticket → /tickets; /table, /vip,
/vip-tables → /tables; /booking, /book, /booknow → /book-now; /artists →
/lineup; /merch, /store → /shop; /sponsors, /partner → /partners; /photos →
/gallery; /about-us → /about; /contact-us → /contact. E2E: `not-found.spec.ts`.

## 11. Site colour themes (Connection / Highland)

Admin › Settings › Site › "Site colour theme" (`site.theme`, values
`connection` default and `highland`; anything else is rejected with 422).
The root layout sets `data-theme` on `<html>` from the cached branding
(`public:site`, revalidated on save). `app/globals.css` defines both palettes
as the `--color-rave-*` tokens plus `--rave-*-rgb` channels; ~90 public
components that hard-coded the neon red/purple/blue now use
`rgb(var(--rave-accent-rgb)/alpha)` or `var(--color-rave-*)`. Motion colour
animations and the hero audio bars take literal colours from
`useSitePalette()` (lib/site-theme.ts); the DESTINY shard canvas is hue-rotated.
Highland follows the Hi-Land Tour poster: ice cyan #55E6F2 / electric blue on
navy black #050B12; solid accent buttons switch to dark text. Admin always keeps
the Connection palette (wrapper + `AdminThemePin` for portalled toasts/tours).
Uploaded images, logos and the hero SVG animation are not recoloured.
E2E: `site-theme.spec.ts`. Full suite 48/48.

## 12. Hero background video

Admin › Content › Homepage › Hero now has "Hero background image" (now
actually used; empty falls back to the featured event's hero image) and an
optional "Hero background video" (new `videoMedia` field: picker filtered to
videos, uploads MP4/WebM/MOV up to 20 MB, previews the first frame). The
homepage plays the video muted, looped and inline behind the existing overlays,
lasers, sponsors and title, with the background image as poster; visitors with
reduced motion get the image only. `/api/v1/media/:id` now answers byte-range
requests (206 / 416, `Accept-Ranges: bytes`) so Safari/iOS can play library
videos. E2E: `hero-video.spec.ts` (upload through the Admin picker, Range
responses, playback, reduced motion, removal). Gallery album tests now pick
images only, since the library can contain videos. All 53 E2E pass when run in
batches that respect the QA login limit.

## 13. Admin row action menus no longer clipped

The "⋯" row menu of the shared Admin list table (`components/admin/ui/DataTable.tsx`,
used by every list screen) rendered inside the table's horizontal scroll
container, so menus on the last rows were cut off. It is now portalled to
`<body>` with fixed coordinates from the trigger, opens upwards when there is no
room below, follows scrolling/resizing, closes on outside click or Escape (focus
returns to the trigger). E2E: `admin-row-menu.spec.ts` (partners, events,
artists, flip-up near the bottom). Full suite 58/58 in login-limit-safe batches.
Admin-wide sweep (`admin-popups-sweep.spec.ts`): visits every screen in the
Admin menu and opens the last row's actions on each list with data (events,
artists, products, news, gallery, partners, staff, roles), plus the top bar
search results, notifications and account menu; every entry must be inside the
viewport and the element actually hit. Full suite 60/60.

## 14. Home lineup: first artist card stayed blank

Each card image in `components/home/LineupPreview.tsx` had its own
`whileInView` clip-path reveal, separate from the card's. On production the
first card's image loaded at ~3.3 s but was still clipped after 10+ s while the
others revealed at ~4.6 s. The image reveal now follows the card's own in-view
variants, so it opens together with the card. `lineup-preview.spec.ts` (desktop
and iPhone) fails 4/4 on the old code and passes on the fix. Full suite 62/62.

## 15. Current event on the homepage; past events below

The homepage, `/tickets`, `/tables`, `/book-now` and `/event` were hard-wired to
DESTINY. `server/services/featured-event.ts` now picks the current event:
Admin › Content › Homepage › Hero › **Current event** (new), else Settings ›
Site › Featured event (now labelled fallback), else the next upcoming published
event (featured first, soonest date, then oldest), else DESTINY. A choice that is
past or unpublished is skipped. Cached on `public:site`/`home`/`events`, so
saving Homepage, Settings or an event updates it at once. `/event` is now a 307
to `/events/<current>` (the permanent `/event → /events/destiny` redirect is
gone); event pages link Tickets/VIP with `?event=` unless they are current.

Past events: Admin › Events › Listing stores `PAST`, but the public API filtered
`COMPLETED`, so DESTINY (marked Past on production) still showed as upcoming
and `/events/past` was empty. Past is now PAST/COMPLETED **or** a date that is
over (end time, else start + 1 day); upcoming is its exact complement written
without NOT (SQL NOT over NULL dates would drop undated events). Past lists are
most recent first. `/events` gains a "Past events" section (up to 4, "View all
past events"); past cards open their event page.

Tickets: the home tickets block read `/events/:slug/tickets` as an array but it
returns `{ settings, tiers }`, so it was always empty; fixed. When an event sells
only through an external provider (Ticket Settings › External provider enabled +
Provider URL, e.g. TicketsCandy) and has no tiers, `/tickets` and the home block
show "Buy tickets on <provider>" instead of "being prepared", and Admin's
setup status counts it as live. E2E: `current-event.spec.ts`; the VIP state test
now expects the next published event when DESTINY is unpublished. Full suite green.

## 16. Two ways to buy; /event redirect; poster-blue Highland

- `/tickets` always offers both: direct checkout on this site (Square flow, unchanged)
  and, when Ticket Settings has an external provider URL, an "or — Buy on
  <provider>" link (new tab). Previously the provider link never showed once an
  event had tiers. The homepage hero keeps "View Ticket Details" (→ /tickets) and
  adds "Or buy on <provider>"; the home tickets block wording adapts.
- `/event` sends a relative Location: behind the proxy `request.url` was
  `http://localhost:3000`, so production redirected visitors there.
- Highland palette resampled from the Hi-Land poster: steel electric blue
  #2AA0DF on near-black navy #04090E (dark text on solid buttons, 6.2:1).
- Admin row-menu tests switch off smooth scrolling before measuring.
