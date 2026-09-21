# Runtime data-source audit

QA run: 2026-09-21
Scope: Admin -> API -> PostgreSQL -> public API -> client, including Docker and Chrome.

## Audit result

| Check | Evidence | Status |
| --- | --- | --- |
| Homepage uses runtime data | `app/page.tsx` loads event, artists, tickets, VIP, partners and bootstrap APIs with safe fallbacks | PASS |
| Static homepage repository removed | `lib/data.ts` was removed; home sections receive API-derived props | PASS |
| Admin list pagination is bounded | Admin pages use `100` or lower rather than the API maximum being exceeded | PASS |
| Admin singleton routes exist | Content, site, social, language, integrations and shipping GET/PUT routes are implemented | PASS |
| Public API envelope parsing | Artist HTTP normalization unwraps `{ data: [...] }` before validation | PASS |
| Build-time route safety | Data-dependent public pages use dynamic rendering; local build completes without prerender errors | PASS |
| Client price authority | Ticket/VIP checkout services calculate totals from database rows; extra client `amountMinor` is rejected | PASS |
| Payment state authority | Finalizer only marks paid after provider payment state is completed; no mock success route was found | PASS |
| Secret handling | Integration status returns configured/healthy metadata only; Square/Brevo/Mailchimp secrets are not returned | PASS |
| External provider readiness | Square status is `configured:false`, `errorCode:NOT_CONFIGURED` in local Docker | EXTERNAL_BLOCKED |
| Presentation-only constants | Navigation labels/paths and visual fallback copy remain static by design; they do not replace persisted content | PASS |

## Intentional non-database content

- Navigation labels, route paths, animation copy and accessibility labels are presentation concerns.
- Sponsor/logo assets used by the hero are bundled visual assets; event title, description, status, venue and ticket data are API-backed.
- Neutral fallbacks such as `TBA`, `TBC`, `Availability to be confirmed`, draft legal copy and empty catalogue states communicate missing publication/configuration state. They are not fake records.

## External dependencies

The local `.env.docker` intentionally has empty Square, Brevo and Mailchimp credentials. Redis is healthy. Consequently, payment capture and provider synchronization are not claimed as end-to-end PASS in this run; the application reports the blocked integration explicitly.
