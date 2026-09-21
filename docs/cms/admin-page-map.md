# Admin page map

Every major public route has a discoverable editing entry point. `:id` is the
selected event record; record pages remain separate from page-level content.

| Client route | Primary admin route | Related data routes |
| --- | --- | --- |
| `/` | `/admin/content/home` | `/admin/settings/global-content`, `/admin/navigation` |
| `/about` | `/admin/content/about` | `/admin/settings/global-content` |
| `/events` | `/admin/content/events` | `/admin/events`, `/admin/events/:id/edit` |
| `/events/past` | `/admin/content/past-events` | `/admin/events`, `/admin/events/:id/edit` |
| `/events/:slug` | `/admin/events/:id/edit` | Event hub quick links: tickets, VIP, lineup, gallery, preview |
| `/tickets` | `/admin/events/:id/tickets/content` | `/admin/events/:id/tickets`, `/tickets/tiers`, `/admin/ticket-purchases` |
| `/tables` | `/admin/events/:id/vip/tables-content` | `/vip`, `/vip/packages`, `/vip/booths`, `/vip/bottles` |
| `/book-now` | `/admin/events/:id/vip/booking-content` | `/admin/events/:id/vip`, `/admin/vip-bookings` |
| `/lineup` | `/admin/content/lineup` | `/admin/artists` |
| `/lineup/:slug` | `/admin/artists/:id/edit` | Artist relations and media |
| `/news` | `/admin/content/news` | `/admin/news` |
| `/news/:slug` | `/admin/news/:id/edit` | Related event and media |
| `/gallery` | `/admin/content/gallery` | `/admin/gallery` |
| `/gallery/:slug` | `/admin/gallery/:id/edit` | Album media and event relation |
| `/shop` | `/admin/content/shop` | `/admin/products`, `/admin/orders`, `/admin/payments` |
| `/shop/:slug` | `/admin/products/:id/edit` | Product media, variants and inventory |
| `/faq` | `/admin/content/faq` | FAQ records |
| `/contact` | `/admin/content/contact` | `/admin/settings/social` |
| `/terms`, `/privacy` | `/admin/content/legal` | Legal document editor |
| Header/mobile/footer | `/admin/navigation` | `/admin/navigation/menus/:id`, `/admin/navigation/locations` |

## Event core boundary

`/admin/events/:id/edit` owns overview, schedule, venue, artists, gallery
relations, FAQ and SEO/publishing. Ticketing and VIP/table configuration are
not embedded in the Event Core form; the event detail hub exposes direct links
to their dedicated modules.

## Access boundary

- `navigation.view` reads route suggestions, menus and locations.
- `navigation.edit` saves drafts and assigns locations.
- `navigation.publish` publishes a menu and invalidates public navigation tags.
- `content.*` controls page-content records; `settings.*` controls the global
  singleton.

## Page-content editor UX

Page-content records are edited with visual controls in the admin: text areas,
image URL/alt-text fields, CTA groups, repeaters for cards/FAQ/process steps,
filter and section builders, visibility toggles, and SEO controls. The storage
and API payload may remain structured, but raw JSON is not exposed as an input
to administrators.
