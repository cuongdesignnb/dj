# Public menu readiness — 2026-10-04

Scope: candidate branch `codex/post-gallery-uat`, based on production baseline
`53f113c57305a9c615f87396e42bc705ba1731ef`. No production menu edits or deployment.
This separates route support from owner decisions about exposure/order.

Production Chrome desktop observation: primary Home / Events / Tickets / VIP
Tables / Book Now; Gallery is in Footer Quick Links. Footer More includes About,
Partners, News and Shop; support/legal includes FAQ, Contact, Terms and Privacy.
The mobile column records isolated Chrome QA rendering capability, not a claim
that production mobile locations/order were modified or separately audited.

| Menu Item | Route | Desktop | Mobile | Content Ready | Functional Ready | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| Home | / | Current primary | CMS renderer verified in QA | Published event/artist content; sales copy needs owner review | Informational navigation yes; not sales readiness | Keep; review ticket promotion wording until release configured |
| Events | /events | Current primary | Same CMS renderer | Published DESTINY; date/schedule remain TBA/TBC | Public list/detail verified | Keep; do not invent dates |
| Tickets | /tickets | Current primary | Internal route supported | CONFIG_REQUIRED: COMING_SOON, zero active tiers | Clean controlled empty state in candidate QA | Owner decides release, tiers, capacity and provider |
| VIP Tables | /tables | Current primary | Shared QA menu verified | CONFIG_REQUIRED: VIP disabled, no active package/booths | Candidate disabled/ready states verified | Do not switch VIP on without approval |
| Gallery | /gallery | Footer only on production; primary verified in QA | Added with actual route picker; shared menu verified | 15 DESTINY + 9 ECHO placements preserved | Catalogue/detail and editing verified | BA review: expose in primary/mobile; no hardcoded Header link |
| Book Now | /book-now | Current primary | Shared QA menu verified | CONFIG_REQUIRED: VIP disabled | Candidate controlled states and real request-only submission verified in QA | Do not announce reservations/payment |
| Lineup | /lineup | Route supported; not current primary | CMS internal route supported | Production shows 7 published artists | List/detail smoke verified in QA | Owner chooses exposure |
| News | /news | Footer More | CMS route supported | TECHNICALLY_READY_CONTENT_MISSING | Clean zero-stories state | Publish approved articles or approve temporary menu exclusion |
| Shop | /shop | Footer More | CMS route supported | TECHNICALLY_READY_CONTENT_MISSING | Clean zero-products state; no fabricated products | Owner approves catalogue or menu exclusion; payments are a separate gate |
| FAQ | /faq | Footer support | CMS route supported | Published questions render | Published-information/empty taxonomy verified | Keep; review answers against actual ticket/VIP release |
| Contact | /contact | Footer support | CMS route supported | Contact details unconfirmed | CONFIG_REQUIRED: production inbox/provider delivery not proven | Owner supplies contacts and confirms notification delivery |
| Terms | /terms | Footer legal | CMS route supported | OWNER_APPROVAL_REQUIRED | Draft-for-review presentation + noindex | Publish only approved legal content |
| Privacy | /privacy | Footer legal | CMS route supported | OWNER_APPROVAL_REQUIRED | Draft-for-review presentation + noindex | Publish only approved legal content |

## Menu Builder evidence

`Gallery` is an existing `gallery` internal route with href `/gallery`.
The test creates a QA-only Menu, adds Home / VIP Tables / Book Now / Gallery via
the actual route library UI, publishes once, assigns its ID to HEADER_PRIMARY
and MOBILE_PRIMARY and verifies both contain the same labels/href. Locations
are restored in `afterAll`. No separate hardcoded desktop/mobile source arrays
were introduced. Configured QA links have zero broken-route entries.

Suggested order for BA review only: Home → Events → Tickets → VIP Tables →
Gallery → Book Now. Publishing that order on production needs owner approval.
Do not infer authority to remove News, Shop, Terms or Privacy from this matrix.
