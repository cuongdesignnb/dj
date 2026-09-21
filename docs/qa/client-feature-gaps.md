# Client feature gaps and environment blockers

These are remaining conditions found during QA. They are separated from code defects that were fixed in this run.

| ID | Severity | Gap / evidence | Impact | Recommended next action |
| --- | --- | --- | --- | --- |
| ENV-001 | P1 external | Square credentials and location are empty; admin integration status is `NOT_CONFIGURED` | Real card capture, refunds and provider webhooks cannot be exercised locally | Configure Square sandbox credentials/location and run a provider-backed payment QA pass. |
| DATA-001 | P2 data state | Public products, news and gallery APIs return empty because seed rows are preview/unpublished | `/shop`, `/news` and `/gallery` show empty states | Publish representative records when content is approved, then rerun public-client QA. |
| CONTENT-001 | P2 content state | Legal API endpoints return `404` until documents are published; frontend currently shows draft-safe copy | Public legal pages are not production-ready as legal documents | Publish reviewed terms/privacy translations before launch. |
| CONTENT-002 | P2 content state | Event date/schedule and ticket availability are not confirmed in seed data | Ticket CTAs cannot create a purchase intent yet | Set confirmed event schedule, ticket availability and `purchasableOnline` flags when sales open. |
| ARCH-001 | P2 integration | Integration settings UI reports provider state but does not persist raw provider secrets in the application database | Provider setup must happen through deployment secrets, not the admin UI | Keep secrets in deployment secret storage and expose only health/configuration metadata. |

## Closed in this run

- The homepage hero and sections no longer depend on the removed static runtime data module.
- Prices now remain visible before the ticket-card animation enters the viewport.
- Admin list requests no longer exceed the API pagination limit.
