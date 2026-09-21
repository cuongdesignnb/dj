# CTA and route matrix

QA run: 2026-09-21
Browser: Chrome, Docker app at `http://localhost:43171`.

| Source CTA / interaction | Destination or request | Result |
| --- | --- | --- |
| Hero `GET TICKETS` | `/tickets` | PASS; route renders a safe event/ticket state. |
| Event overview `VIEW EVENT DETAILS` | `/events/destiny` | PASS; route renders event details/TBA state. |
| Lineup preview | `/lineup` | PASS; lineup page renders 8 artists. |
| Artist card | `/lineup/{slug}` | PASS; RYAL detail route rendered. |
| Ticket card | `/tickets` | PASS; route renders published tier data and disabled/not-yet-available state correctly. |
| VIP section | `/tables` | PASS; table page renders the request-only state. |
| Booking CTA | `/book-now` and `POST /api/v1/booking-requests` | PASS for route and API contract. |
| Header `SHOP` | `/shop` | PASS; empty published catalogue state is shown. |
| Cart | `/cart` | PASS; empty cart state is shown. |
| Contact CTA/form | `/contact` and `POST /api/v1/contact` | PASS; valid canary returned `202` and was cleaned up. |
| Newsletter form | `POST /api/v1/newsletter/subscribe` | PASS; valid canary returned `202`, invalid email returned `422`, and canary was cleaned up. |
| Partners/social links | HTTPS URLs from persisted social settings | PASS; empty settings produce no `#` placeholders or dead links. |
| Footer legal links | `/terms`, `/privacy` | PASS; frontend renders draft-safe pages while unpublished API documents remain gated. |
| Homepage section anchors | `#tickets`, `#vip-tables`, `#collections`, `#catalogue` | PASS; each destination is backed by an actual section wrapper, not a dead hash. |
| Public route matrix | `/`, `/about`, `/artists`, `/partners`, `/events`, `/event`, `/events/destiny`, `/tickets`, `/tables`, `/book-now`, `/lineup`, `/gallery`, `/news`, `/shop`, `/cart`, `/faq`, `/contact`, `/terms`, `/privacy` | PASS; Chrome spot-check rendered every route without a load-error state. `/event` resolved to `/events/destiny`. |

## Dead-CTA check

The final homepage check found `0` hash-only links. Empty social settings are omitted instead of rendered as `href="#"`. The newsletter form has a real API target and visible success/error handling. The browser sweep and SEO route matrix agree on the CTA destinations.
