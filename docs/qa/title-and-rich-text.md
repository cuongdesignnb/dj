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
