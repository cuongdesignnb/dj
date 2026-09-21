# Data lineage matrix

QA run: 2026-09-21
Environment: Docker Compose (`destiny-app`, PostgreSQL, Redis) with Chrome at `http://localhost:43171`.

Gate 1 result: `PASS`. The event admin form now has a complete, verified Admin Field -> Mutation API -> PostgreSQL -> Public API -> Client path. The matrix distinguishes database-backed runtime data from intentional presentation-only copy and external provider state.

| Surface | Client entry point | Runtime source | Persistence / provider | Result |
| --- | --- | --- | --- | --- |
| Event admin editor (core + nested data) | `/admin/events/:id` | `PATCH /api/v1/admin/events/:id` | Event/media/SEO fields; event translations; ticket tiers; VIP package, booths and bottles; event artists; gallery albums; FAQ items | PASS; strict validation and transactional relation sync round-tripped all fields. Canary restored the original 3 tiers, 17 booths, 6 bottles, 8 artists, 2 albums and 3 FAQs. |
| Public event detail | `/events/destiny`, `/event` | `GET /api/v1/events/destiny` plus ticket/VIP subresources | Event, translations, media, ticket tiers, VIP relations, FAQ items and gallery albums | PASS; public DTO exposes the same persisted event graph and `/event` redirects to `/events/destiny`. |
| Homepage hero and event overview | `/` | `GET /api/v1/events/destiny` | Event, event translations, media and event settings | PASS; original hero visual is preserved while title/status/venue data are API-backed. |
| Homepage lineup | `/`, `/lineup` | `GET /api/v1/artists` | Artist, artist translations, media | PASS; 8 seeded artists render. The API envelope is normalized before client parsing. |
| Ticket tiers | `/`, `/tickets`, `/events/destiny` | `GET /api/v1/events/destiny/tickets` | TicketTier and event | PASS; 3 tiers and server prices render. Seeded availability is `UNKNOWN` and online purchase is disabled. |
| VIP / tables | `/`, `/tables`, `/book-now` | `GET /api/v1/events/destiny/vip` | VipPackage, VipBooth, BottleOption and relations | PASS; package price/capacity/bottles render. Payment mode is request-only. |
| Partners and footer | `/`, `/partners` | `GET /api/v1/partners`, `GET /api/v1/site/bootstrap` | Partner, SiteSetting and content translations | PASS; seeded partners render. Empty social settings are hidden rather than emitted as dead links. |
| About and contact content | `/about`, `/contact` | `GET /api/v1/site/bootstrap` and content endpoints | ContentPage, ContentTranslation, SiteSetting | PASS; contact submission is persisted through `POST /api/v1/contact`. |
| Newsletter | Homepage footer | `POST /api/v1/newsletter/subscribe` | NewsletterSubscriber; optional external provider later | PASS; valid canary returned `202`, invalid email returned `422`; canary row was removed after verification. |
| Admin lists | `/admin/*` | `GET /api/v1/admin/...` | Corresponding PostgreSQL resources | PASS; admin dashboard and event list returned real counts with bounded pagination. |
| Admin singleton settings/content | `/admin/content/*`, `/admin/settings/*`, `/admin/shipping` | `GET`/`PUT /api/v1/admin/...` | ContentPage translations, SiteSetting and `shipping.config` | PASS; singleton GETs returned `200`; social PUT round-trip returned `200` with CSRF protection. |
| Cache and revalidation | Public routes after admin mutation | Resource tags plus `revalidatePath`/`revalidateTag` | Next cache and public route graph | PASS; event SEO canary became visible through the public API, was restored, and resource-specific paths/tags are invalidated after writes. |
| Public products/cart | `/shop`, `/cart` | `GET /api/v1/products` | Product, ProductVariant, inventory | CONDITIONAL; API is healthy but no published products exist, so the client shows its empty state. |
| Public news | `/news` | `GET /api/v1/news` | NewsArticle and translations | CONDITIONAL; seeded article is preview-only, so the public response is empty by design. |
| Public gallery | `/gallery` | `GET /api/v1/gallery` | GalleryItem, media and event | CONDITIONAL; no published gallery rows exist, so the client shows its empty state. |
| FAQ | `/faq` | `GET /api/v1/faq` | FaqItem and translations | PASS; public endpoint returned `200`. |
| Legal | `/terms`, `/privacy` | `GET /api/v1/legal/terms` and `/privacy` | LegalDocument and translations | CONDITIONAL; seeded legal documents are draft, so API gating returns `404`; frontend pages render a draft-safe state. |
| Ticket checkout intent | Ticket flow | `POST /api/v1/checkout/ticket-intent` | TicketTier pricing, TicketPurchase and CheckoutIntent | PASS for validation; unavailable tier returned `422`. Price is recalculated server-side and client-supplied `amountMinor` is rejected. |
| VIP checkout intent | VIP flow | `POST /api/v1/checkout/vip-intent` | VipPackage, VipBooth, VipBooking and CheckoutIntent | PASS for validation; request-only package returned `409`. |
| Merchandise checkout/payment | Cart checkout | `POST /api/v1/checkout/session`, Square payment endpoints | Order, CheckoutIntent, Payment and Square | EXTERNAL_BLOCKED; Square credentials are intentionally empty in `.env.docker`. |
| Contact / booking leads | `/contact`, `/book-now` | `POST /api/v1/contact`, `POST /api/v1/booking-requests` | ContactMessage and BookingRequest | PASS for API contract; contact canary returned `202` and was removed after DB verification. |

## Source-of-truth rules verified

- Prices, availability, purchase flags, VIP mode and inventory decisions come from the server/API.
- Client checkout payloads do not provide an authoritative amount.
- Event mutation fields are strict: injected client `amountMinor` and empty external-provider URLs are rejected rather than persisted.
- `lib/data.ts` is no longer a runtime source; the remaining navigation constants are presentation-only.
- Empty, draft and not-yet-configured states are shown explicitly instead of being represented as fake published data.
- QA canaries were restored or deleted: the event SEO/title canary was restored exactly, contact/newsletter rows were removed, and the two named smoke events were deleted after dependency checks showed zero bookings/purchases.
