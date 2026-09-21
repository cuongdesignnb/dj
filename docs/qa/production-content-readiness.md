# Production content readiness

QA run: 2026-09-21
Environment: Docker Compose (`destiny-app`, PostgreSQL, Redis) with Chrome at `http://localhost:43171`.

This matrix separates technical availability from editorial approval. A seeded row is not treated as production-ready merely because it exists in PostgreSQL. Preview/draft rows remain gated, unknown event facts remain `TBA`/`TBC`, and local indexing stays disabled.

| Domain | Launch Required | Real Data | Published | Client State | SEO State | Status |
| --- | --- | --- | --- | --- | --- | --- |
| DESTINY | Yes | Yes: venue, event graph and canonical media | Yes | Hero/detail render; date and schedule remain TBA/TBC | Local noindex; production URL not supplied | BLOCKED_APPROVAL |
| Artists | Yes | Yes: 8 translated artist records with media | Yes | Homepage and lineup render real artists | Local noindex; detail routes pass SEO checks | PASS |
| Tickets | Yes for sales | Yes: 3 tiers and server prices | Event published; sale disabled (`UNKNOWN`, `purchasableOnline=false`) | Prices render; unavailable tiers cannot create checkout intent | Local noindex; event schema remains conditional | BLOCKED_APPROVAL |
| VIP | Yes | Yes: request-only package, 17 booths, 6 bottles | Through published event | Tables and booking request render; no payment is claimed | Local noindex; request-only state is explicit | PASS_WITH_EXTERNAL_BLOCKER |
| Products | Owner decision | Preview rows only; no approved launch catalogue | No | `/shop` shows intentional empty state with no broken checkout CTA | Excluded from public index while unpublished | BLOCKED_APPROVAL |
| News | Owner decision | One preview article only | No | `/news` shows intentional preview/empty state | Article schema excluded while unpublished | BLOCKED_APPROVAL |
| Gallery | Owner decision | Two preview albums only | No | `/gallery` shows intentional preview/empty state | Gallery routes remain non-indexed locally | BLOCKED_APPROVAL |
| Past Events | Owner decision | No approved public history | No | No invented historical claims are exposed | Excluded until verified history is published | BLOCKED_APPROVAL |
| Partners | Yes | Yes: 2 published partners plus bundled brand assets | Yes | Homepage/footer/partners render real partner data | Local noindex; route SEO checks pass | PASS |
| FAQ | Yes | Yes: seeded FAQ content | Yes | `/faq` renders the public FAQ state | Local noindex; FAQ schema is conditional on approval | PASS |
| Legal | Yes | Draft Terms and Privacy documents exist | No; API remains gated | `/terms` and `/privacy` show draft-safe states | Not indexable until approved/published | BLOCKED_APPROVAL |
| Contact | Yes | API contract is real, but production contact fields are empty | N/A | Contact form has a real endpoint and validation | No standalone index requirement | BLOCKED_APPROVAL |
| Social | Owner decision | Persisted social fields are empty | N/A | Missing values hide cleanly; no `#` or fake URLs | No fake social URLs are emitted | BLOCKED_APPROVAL |

## Approval checklist before launch

- Approve and publish the DESTINY date, schedule, ticket availability and online-sales flags.
- Review and publish Terms and Privacy translations with the real effective date/version.
- Provide real contact details and approved social URLs, or explicitly exclude those modules from launch.
- Decide which products, news, gallery and past-event records are in launch scope; publish only approved records.
- Provide Square sandbox credentials/location/webhook configuration, run the provider-backed sandbox flow, then repeat with production credentials under the deployment change process.
- Set production `APP_URL`/`NEXT_PUBLIC_SITE_URL` and enable indexing only after HTTPS canonical, robots and sitemap checks pass.

No content, date, legal clause, contact detail or payment success is inferred from seed data. This is why the technical QA result can pass while `PRODUCTION_READY` remains `NO`.
