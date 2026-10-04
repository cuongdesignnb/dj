# Public page readiness — 2026-10-04

Statuses below describe the tested candidate behavior combined with preserved
production content/configuration. They are not a claim that the candidate has
been deployed. Production still runs the supplied baseline until an approved
deploy. A 200 response alone is not a readiness criterion.

| Route | Status | Evidence / remaining prerequisite |
| --- | --- | --- |
| / | CONFIG_REQUIRED | Production renders published DESTINY and artists; dates remain unknown. Tickets/VIP promotion must reflect release configuration before a sales launch. No hero/SVG/content replacement performed. |
| /events | READY | Production list renders real published DESTINY and venue. QA checks controlled list/detail behavior; no fabricated history/dates. Informational readiness only. |
| /events/[slug] | READY | Published DESTINY API graph unchanged; real detail smoke passes. Draft/deleted events remain private; only published eligible events may be linked from albums. |
| /tickets | CONFIG_REQUIRED | ticketingEnabled=true, COMING_SOON, zero active tiers, Square off. Clean CMS empty state in QA, no broken selector or invented prices. |
| /tables | CONFIG_REQUIRED | Candidate explicitly handles VIP_DISABLED, BOOKING_DISABLED, NO_ACTIVE_PACKAGE, NO_BOOTHS, NO_AVAILABILITY, NOT_CONFIGURED, READY and transport/payload errors. Owner must enable/configure production VIP. |
| /book-now | CONFIG_REQUIRED | Same business-state handling; request-only nullable-booth contract verified against real PostgreSQL. One request stored as RECEIVED, never reservation/payment. Production VIP disabled; no production test request. |
| /lineup | READY | Production shows seven published artists, including RYAL and NICOLE CHEN. QA list/detail smoke, media and public gating retained. No artist assets modified. |
| /gallery | READY | Candidate hero → CMS album catalogue → labelled optional preview. Counts derived from placements; both preserved production albums remain eligible. Preview capped at six lazy thumbnails. |
| /gallery/[slug] | READY | Candidate ECHO has no inherited event CTA; linked published event works, linked Draft/Archived/deleted event does not. Order/ALT/caption, persistence and media retention tested. Production deploy still pending. |
| /news | TECHNICALLY_READY_CONTENT_MISSING | Production zero stories; clean CMS empty state. No fake article published. |
| /news/[slug] | TECHNICALLY_READY_CONTENT_MISSING | Real published-detail route exists, unpublished/missing records resolve to controlled not-found. No approved production article to launch. |
| /shop | TECHNICALLY_READY_CONTENT_MISSING | Production zero products; clean CMS empty state. No fake merchandise or pricing. |
| /shop/[slug] | TECHNICALLY_READY_CONTENT_MISSING | Detail/variant pipeline exists; unpublished/missing product gated. Approved products, stock/shipping and provider-backed checkout need their own launch gate. |
| /faq | READY | Production renders published ticket-release questions with honest coming-soon answers. QA controlled rendering; owner should review as release configuration changes. |
| /contact | CONFIG_REQUIRED | Real form/API persistence path exists and smoke renders. Production contact fields and provider/inbox delivery remain unconfirmed; this is not a successful email-delivery claim. |
| /terms | OWNER_APPROVAL_REQUIRED | Production visibly says Draft for review; gated API yields prepared state, metadata stays noindex. No legal clauses invented. |
| /privacy | OWNER_APPROVAL_REQUIRED | Same draft-for-review and noindex behavior, confirmed in production Chrome; owner/legal approval outstanding. |

## Verification scope

Chrome QA runs against `127.0.0.1:43291` using its own PostgreSQL/Redis/media
volumes and guarded fixtures. The full suite exercises Gallery Draft → reload →
Publish → edit/reorder/remove → Draft, duplicate-slug errors, media/event
validation, editor/viewer/anonymous/CSRF rules and concurrent create protection.
Removing a placement keeps its Media Library asset. Draft public API stays 404,
list/event nested data hides it, and rendered detail is not-found/noindex.

With Next 16 loading boundaries, notFound/permanentRedirect can be streamed
after HTTP 200 headers. Regression checks the actual hidden-content/noindex
outcome and browser redirect destination, as well as API 404, instead of treating
the streamed shell's status alone as exposure or success.

Production read-only snapshots compare all Gallery bodies exactly and preserve
album IDs, placement IDs/order, ALT, captions and image URLs. All 24 distinct
referenced assets return 200 and their SHA-256/size comparisons match. This is a
Gallery-scoped asset inventory, not a global authenticated Media Library count.

## Owner decisions

- Approve VIP availability, enabled package/booths, capacities and bottle rules.
- Configure ticket release/tiers/provider without manufacturing historic prices.
- Review primary/mobile Gallery placement and menu order.
- Supply approved News/Shop content or approve temporary menu exposure changes.
- Approve legal documents, contact details and delivery/provider configuration.
- Approve deployment separately; keep unknown event dates/schedule TBA/TBC.
