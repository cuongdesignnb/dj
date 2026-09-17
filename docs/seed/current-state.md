# Seed current state (baseline)

Captured before the seed/SEO completion work on 2026-09-17.

## Data sources

- Prisma PostgreSQL schema in `prisma/schema.prisma` is the runtime source of truth.
- Public repositories call `/api/v1/*` and do not intentionally fall back to mock repositories.
- `prisma/seed.ts` is the only seed entry point at baseline and contains all data definitions in one file.
- Public media is served from `public/assets` and was not fully registered in `media_assets`.

## Baseline risks found

- The seed used `deleteMany`/`createMany` for mutable genres, tickets, booths, product images, and gallery media.
- Several seed updates overwrote editor-controlled state, including publication timestamps and statuses.
- Only a lowercase `super_admin` role was seeded; the required role/permission baseline was incomplete.
- Five VIP booths were seeded although the source requirement is twelve, and availability used the schema default instead of explicit `ON_REQUEST`.
- Products, news, gallery, FAQ, and legal records were seeded as published even where the source material only confirms preview/draft status.
- The seed had no blank-database verifier or second-run idempotency verifier.
- Seed scripts were not modular and there was no explicit bootstrap/preview mode separation.

## Confirmed source data to preserve

- Event `destiny`, title `DESTINY`, Metro City, Perth, Australia, date TBA, schedule TBC.
- Eight canonical artists and their billing order.
- Three ticket tiers, one VIP package, twelve on-request booths, six bottle options, and two confirmed partners.
- Admin credentials must only come from `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD`.

## Required target

Move definitions into modular seed files, use stable keys/upserts/transactions, make preview data opt-in, preserve editor changes on repeat runs, register media, and add `db:seed:bootstrap`, `db:seed:preview`, and `db:seed:verify` commands.
