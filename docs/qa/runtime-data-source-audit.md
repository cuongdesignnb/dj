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
| Event mutation completeness | Event editor payload maps media, SEO, tickets, VIP, artists, albums and FAQs into strict validation and transactional relation sync | PASS |
| Event public DTO completeness | Public event DTO and event repository expose tickets, VIP, FAQ and gallery relations consumed by client routes | PASS |
| Cache invalidation | Public repositories use resource tags; admin writes call resource-specific `revalidateTag`/`revalidatePath` | PASS; SEO/title canary was visible through the public API and restored |
| Client price authority | Ticket/VIP checkout services calculate totals from database rows; extra client `amountMinor` is rejected | PASS |
| Payment state authority | Finalizer only marks paid after provider payment state is completed; no mock success route was found | PASS |
| Secret handling | Integration status returns configured/healthy metadata only; Square/Brevo/Mailchimp secrets are not returned | PASS |
| External provider readiness | Square status is `configured:false`, `errorCode:NOT_CONFIGURED` in local Docker | EXTERNAL_BLOCKED |
| Media persistence cleanup | Legacy `/public/assets/...` rows were soft-deleted only when unreferenced; canonical static assets remain available | PASS; active legacy URL count is `0` |
| QA data cleanup | Event SEO canary restored; contact/newsletter canaries removed; named smoke events had zero dependencies and were deleted | PASS |
| Presentation-only constants | Navigation labels/route paths and visual fallback copy remain static by design; they do not replace persisted content | PASS |

## Intentional non-database content

- Navigation labels, route paths, animation copy and accessibility labels are presentation concerns.
- Sponsor/logo assets used by the hero are bundled visual assets; event title, description, status, venue and ticket data are API-backed.
- Neutral fallbacks such as `TBA`, `TBC`, `Availability to be confirmed`, draft legal copy and empty catalogue states communicate missing publication/configuration state. They are not fake records.
- Six intentionally unbound seeded assets (`logo-connection.svg`, partner logos, `vip-booth.jpg`, `bar-list.jpg`, `club-map.jpg`) are referenced directly by presentation code and are not treated as orphan runtime records.

## External dependencies

The local `.env.docker` intentionally has empty Square, Brevo and Mailchimp credentials. Redis is healthy. Consequently, payment capture and provider synchronization are not claimed as end-to-end PASS in this run; the application reports the blocked integration explicitly.

## Lint warning classification

`npm run lint` passes with `0` errors and `114` warnings. The warnings are non-blocking: existing UI hook/unused-variable warnings and explicit-`any` boundary warnings in legacy/API DTO code. No warning indicates a runtime mock repository, hardcoded business dataset, fake payment success or dead client action. They remain tracked technical debt rather than being silently counted as zero.
