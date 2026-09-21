# CMS coverage matrix

This matrix is the source-of-truth map for user-editable public content. CSS,
layout, motion and availability derived from database records remain code-owned
or system-derived and are intentionally not CMS fields.

| Client route | Section | Field group | Current source | Admin location | API | DB | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/tickets` | Hero | eyebrow, title, description, image, side/foot notes | Page Content | `/admin/events/:id/tickets/content` | `GET/PATCH /api/v1/admin/page-content/tickets:<eventId>` | `page_contents`, `page_content_translations` | PASS |
| `/tickets` | Selector | labels, description, empty state | Page Content | `/admin/events/:id/tickets/content` | same | same | PASS |
| `/tickets` | Trust/info/FAQ | repeaters and CTAs | Page Content | `/admin/events/:id/tickets/content` | same | same | PASS |
| `/tickets` | Sales settings | status, currency, providers, sale window | Event settings | `/admin/events/:id/tickets` | `/api/v1/admin/events/:id/tickets/settings` | `events` | PASS |
| `/tickets` | Tier cards | price, capacity, availability, provider IDs | Ticket API | `/admin/events/:id/tickets/tiers` | `/api/v1/admin/events/:id/tickets/tiers` | `ticket_tiers` | PASS |
| `/tables` | Hero | titles, description, image, notes, CTAs | Page Content | `/admin/events/:id/vip/tables-content` | `GET/PATCH /api/v1/admin/page-content/tables:<eventId>` | page content tables | PASS |
| `/tables` | Club map | labels, disclaimer, background | Page Content + booth API | `/admin/events/:id/vip/tables-content`, `/booths` | page content + booths endpoints | page content, `vip_booths` | PASS |
| `/tables` | VIP information/FAQ/CTA | repeaters and CTA | Page Content | `/admin/events/:id/vip/tables-content` | same | same | PASS |
| `/tables` | Packages/booths/bottles | price, deposit, coordinates, options | VIP API | `/admin/events/:id/vip/packages`, `/booths`, `/bottles` | `/api/v1/admin/events/:id/vip/*` | `vip_packages`, `vip_booths`, `bottle_options` | PASS |
| `/book-now` | Hero/tabs/form | all labels, titles, notes | Page Content | `/admin/events/:id/vip/booking-content` | `GET/PATCH /api/v1/admin/page-content/booking:<eventId>` | page content booking | PASS |
| `/book-now` | Process/FAQ/CTA | repeaters and actions | Page Content | `/admin/events/:id/vip/booking-content` | same | same | PASS |
| `/events` | Listing chrome | hero, filters, featured/empty copy, CTA, SEO | Page Content + Event API | `/admin/content/events` | `GET /api/v1/page-content/events-list` | page content + `events` | PASS |
| `/events/past` | Archive chrome | hero, filters, empty copy, CTA, SEO | Page Content + Event API | `/admin/content/past-events` | `GET /api/v1/page-content/past-events` | page content + `events` | PASS |
| `/lineup` | Listing chrome | hero, filters, info section, CTA, SEO | Page Content + Artist API | `/admin/content/lineup` | `GET /api/v1/page-content/lineup-list` | page content + `artists` | PASS |
| `/news` | Listing chrome | hero, filters, featured/latest/empty copy, CTA, SEO | Page Content + News API | `/admin/content/news` | `GET /api/v1/page-content/news-list` | page content + `news_articles` | PASS |
| `/gallery` | Listing chrome | hero, filters, featured/empty copy, CTA, SEO | Page Content + Gallery API | `/admin/content/gallery` | `GET /api/v1/page-content/gallery-list` | page content + `gallery_albums` | PASS |
| `/shop` | Listing chrome | hero, category labels, featured/why/empty copy, CTA, SEO | Page Content + Product API | `/admin/content/shop` | `GET /api/v1/page-content/shop-list` | page content + `products` | PASS |
| All public routes | Header/mobile | menu labels, routes, nesting, CTA | Menu Builder API | `/admin/navigation/menus`, `/locations` | `/api/v1/navigation/:location` | `menus`, `menu_items`, `menu_locations` | PASS |
| All public routes | Footer | quick/legal/secondary links, global footer copy | Menu Builder + global content | `/admin/navigation`, `/admin/settings/global-content` | navigation + page-content APIs | menu tables + page content | PASS |
| All public routes | Global | tagline, footer description, age notice, generic CTA, copyright, empty copy | Page Content | `/admin/settings/global-content` | `GET/PATCH /api/v1/admin/page-content/global-content` | page content tables | PASS |

## Lineage rules

- Availability, payment status, stock, sold counts and booking status are
  system-derived from the event/order/booking records.
- Presentation fields listed above are validated with the typed Zod schemas in
  `lib/cms/page-content.ts`; arbitrary JSON is rejected at the API boundary.
- Vietnamese content falls back explicitly to the English translation when the
  requested locale is not populated.
