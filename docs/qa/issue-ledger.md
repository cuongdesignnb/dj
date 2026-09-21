# QA issue ledger

QA run: 2026-09-21
Repository: `cuongdesignnb/dj`
Environment: Docker Compose + Chrome.

| ID | Severity | Area | Finding | Resolution / disposition | Status |
| --- | --- | --- | --- | --- | --- |
| P1-001 | P1 | Admin lists | Several admin pages requested `pageSize` above the API maximum and returned `422`. | Bounded dashboard, page-data and FAQ requests to `100`. | FIXED |
| P1-002 | P1 | Admin singletons | Homepage/content/settings/shipping screens had no matching API persistence routes. | Added authenticated GET/PUT singleton handlers with DB persistence. | FIXED |
| P1-003 | P1 | RBAC | FAQ/legal UI permission was mapped to nonexistent `support`, causing access denial for seeded admin roles. | Mapped FAQ/legal to the existing `content` permission. | FIXED |
| P1-004 | P1 | Public rendering | Data-dependent pages could surface build-time error output after failed prerender requests. | Marked affected pages dynamic and added safe runtime handling. | FIXED |
| P1-005 | P1 | Public client | Artist API envelope `{ data: [...] }` was not normalized by the client parser. | Added envelope normalization before validation. | FIXED |
| P1-006 | P1 | Homepage lineage/CTAs | Homepage sections read stale static data and included dead hash social links. | Refactored sections to API-derived props, dynamic footer/social/newsletter behavior and safe empty states. | FIXED |
| P2-007 | P2 | Price rendering | Animated ticket prices initially rendered as `$ 0` before entering the viewport. | Initial render now shows the server-backed amount; animation still runs on entry. | FIXED |
| P1-007 | P1 | Event lineage | Event admin mutation previously covered only core fields, leaving ticket/VIP/artist/gallery/FAQ/SEO fields outside the verified write path. | Added strict nested schemas, transactional relation synchronization, complete admin round-trip and public DTO coverage. | FIXED |
| P1-008 | P1 | Public cache | Admin writes did not have an explicit resource/path invalidation contract for public reads. | Added resource tags and `revalidateTag`/`revalidatePath` hooks; event canary became public and was restored. | FIXED |
| P2-009 | P2 | Media hygiene | Ten unreferenced legacy `public/assets/...` rows remained in the database. | Added a migration that soft-deletes only unreferenced legacy rows; no physical file was removed. | FIXED |
| P2-010 | P2 | QA data | Two archived smoke-test events were still visible in Admin after earlier API QA. | Verified zero booking/purchase/VIP dependencies, deleted the exact smoke rows, restarted app and rechecked Admin. | FIXED |
| ENV-001 | P1 external | Payments | Square is not configured in local Docker. | No fake payment success was added; valid flows report blocked/unavailable state. | OPEN / EXTERNAL_BLOCKED |
| DATA-001 | P2 data state | Public catalogue | Products, news and gallery have no published seed rows. | Client empty states are intentional and truthful. | OPEN / CONTENT_REQUIRED |
| CONTENT-001 | P2 content state | Legal | Terms/privacy seed documents are drafts and remain gated by the public API. | Frontend renders a draft-safe state; publication requires content approval. | OPEN / CONTENT_REQUIRED |
| CONTENT-002 | P2 content state | Tickets/event | Ticket availability is `UNKNOWN`, online purchase is disabled, and schedule is TBA/TBC. | Checkout rejects unavailable tiers; publish confirmed event data before sales. | OPEN / CONTENT_REQUIRED |
| ARCH-001 | P2 integration | Secrets | Provider secret fields are not stored in the app DB. | Deployment environment remains the source of truth; admin returns status only. | OPEN / DESIGN |

## Security/payment observations

- No runtime mock-payment success path, query-string `status=paid` trust, or client-authoritative checkout amount was found.
- CSRF-protected admin singleton PUT round-trip passed.
- Invalid newsletter input returned `422`; checkout payloads were strict and rejected an injected `amountMinor`.
