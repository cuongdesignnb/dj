# Event API Contract — `/event` page data source

This document is the source of truth for backend developers integrating with
the `/event` page. The frontend is built around a single normalized payload
that comes through the PostgreSQL-backed API repository.

## Frontend surface

- Route: `GET /event`
- Source code:
  - `lib/events/types.ts` — TS types (source of truth)
  - `lib/events/validation.ts` — runtime validator
  - `lib/events/repository.server.ts` — `getEventRepository()` factory
  - `app/api/v1/[...path]/route.ts` — API route handler
  - `lib/events/presentation.ts` — action resolver, date formatting, errors
- Env: see `.env.example`
- Runtime configuration:
  1. Set `APP_URL` to the public application origin.
  2. Set `EVENT_SLUG` if the slug is not `destiny`.
  3. Set `SITE_URL` (only) to your real production origin if you want
     canonical link tags. Otherwise the page is generated without one.

> A 500, a timeout, a schema mismatch, or a missing database/API response all
> surface to the user
> through `app/event/error.tsx`.

## Endpoint proposal

```
GET {EVENT_API_BASE_URL}/public/events/{slug}
```

### Path params

| Name | Type   | Notes                                     |
| ---- | ------ | ----------------------------------------- |
| slug | string | URL-encoded, e.g. `destiny`, `rave-2026`. |

### Response (200 OK)

```json
{
  "data": {
    "schemaVersion": 1,
    "event": { /* see EventRecord */ },
    "site": { /* see SiteBrand */ }
  }
}
```

The wrapper is optional — the backend may also return the bare
`{ schemaVersion, event, site }` object. Both are accepted by the
validator.

### Error responses

| Status | Meaning                          | Frontend behaviour                                       |
| ------ | -------------------------------- | -------------------------------------------------------- |
| 404    | Event not found                  | `not-found.tsx` is rendered.                            |
| 4xx    | Other client errors              | `error.tsx` is rendered with a generic message.         |
| 5xx    | Upstream errors                  | `error.tsx` is rendered; the page does not invent content. |
| Network| Timeout (8s), abort, parse error | `error.tsx` is rendered with a network/invalid message. |

## Schema (`schemaVersion: 1`)

The full TypeScript types live in [`lib/events/types.ts`](../lib/events/types.ts).
A non-exhaustive summary:

```ts
type MediaAsset = {
  src: string;        // safe URL or /assets/* path
  alt: string;        // required for accessibility
  width: number;      // positive
  height: number;     // positive
  objectPosition?: string;
};

type FeatureCard = {
  id: string;
  icon: 'globe' | 'users' | 'music' | 'sparkles' | 'map-pin' | 'headphones';
  title: string;
  description: string;
};

type ArtistSummary = {
  id: string;
  slug: string;
  name: string;
  country: string;
  portrait: MediaAsset | null;
  profileHref: string | null;   // internal path only, or null
};

type EventVenue = {
  name: string;
  city: string;
  address: string | null;
  description: string;
  image: MediaAsset | null;
  mapUrl: string | null;
};

type EventRecord = {
  id: string;
  slug: string;
  name: string;
  title: string;            // H1 on /event
  intro: string;            // lead paragraph
  accentLine: string;       // tagline-style line, accent color
  aboutParagraphs: string[];
  genres: string[];
  startsAt: string | null;  // ISO-8601 with offset or Z, or null
  endsAt: string | null;
  doorsOpenAt: string | null;
  timeZone: string;         // IANA tz, e.g. "Australia/Perth"
  poster: MediaAsset | null;
  heroBackground: MediaAsset | null;
  experienceImage: MediaAsset | null;
  highlights: FeatureCard[];       // About section
  expectations: FeatureCard[];     // What to Expect section
  artists: ArtistSummary[];        // 4 visible, expand to 8 in place if /lineup absent
  venue: EventVenue;
  actions: {
    ticketUrl: string | null;      // safe URL, or null
    vipRequestUrl: string | null;  // safe URL, or null
  };
  seo: {
    title: string;
    description: string;
    image: MediaAsset | null;
  };
  contentStatus: 'preview' | 'published';
};

type SiteBrand = {
  brandName: string;
  tagline: string;
  logo: MediaAsset;
  partners: Array<{ id: string; name: string; logo: MediaAsset }>;
  contact: {
    email: string | null;
    phone: string | null;
    socials: Array<{
      id: string;
      platform: 'facebook' | 'instagram' | 'youtube' | 'tiktok';
      url: string;       // safe URL
    }>;
  };
};
```

### Field rules

- Dates: ISO-8601 with timezone offset (`2026-05-30T21:00:00+08:00`) or `Z`.
  The frontend formats these in the event's `timeZone` field — never in the
  user's local timezone — so the audience sees the right time regardless of
  where they browse from.
- `startsAt < endsAt` is enforced when both are provided. Doors open must
  not be later than `startsAt`.
- URLs:
  - External: `http://` or `https://` only.
  - Internal paths: single leading `/` only. `//host/...` and `javascript:`
    are rejected.
  - Image `src` may also be a local `/assets/*` path served by the
    `/assets/[filename]` Next.js route.
- `contentStatus`:
  - `preview` — page is rendered, JSON-LD is suppressed, `<meta robots>`
    is `noindex,nofollow`. Use this for unreleased events.
  - `published` — page emits JSON-LD and is eligible for indexing.
- Null vs empty arrays:
  - `highlights: []`, `expectations: []`, `artists: []` — section renders
    an "X coming soon" empty state.
  - `poster: null`, `heroBackground: null`, `venue.image: null` — the page
    falls back to a designed placeholder.

## Frontend fallback behaviour (no fake claims)

When `actions.ticketUrl` is `null`, the Get Tickets button falls back to the
local `/tickets` route, and finally to `/#tickets` with a note: *"Online
ticketing link to be announced."* The page never claims a booking is
confirmed. Similarly, `actions.vipRequestUrl: null` falls back to `/tables`
→ `/#vip-tables`.

`Nav` links that have no internal route resolve to either the real route or
to a "Soon" placeholder link in the footer.

## Local development

- Local development uses the included PostgreSQL and Redis compose services.
  The repository calls `GET /api/v1/events/{slug}` with `cache: 'no-store'`
  and an 8-second timeout.

## Testing the contract locally

Run the existing test suite (when present) and the build to catch schema
drift:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The validator throws on:

- Missing fields
- Wrong icon / platform enums
- Non-positive dimensions
- Unsafe URLs (any scheme other than `http`/`https`, `javascript:`, leading
  `//`, or any path not starting with `/`)
- Date order violations
- Schema mismatch on `schemaVersion`

## Mapping to the homepage

The homepage shares the same data source for artists (through `lib/data.ts`
and the former local source). The homepage now uses the same API-backed repository call so
artist metadata, lineup order, and country flags stay in sync across both pages.
