# Gallery album persistence fix

Verified locally on 2026-10-03. No production deployment or production writes.

## Root cause and trace

`galleryDefinition` → `ResourceForm` → `saveRecord` → `apiPayload` →
`HttpAdminRepository` → `/api/v1/admin/gallery` → Prisma/PostgreSQL.

The POST dispatcher had no Gallery create implementation, so it reached the
generic “This admin resource cannot be created through the API yet.” error.
The form-to-API mapper dropped `items` and SEO, PATCH did not save image
placements, and the admin response returned raw Prisma media records rather
than the form's `image` references. Fixing only the error message would not
have fixed persistence or editing.

`saveGalleryAlbum` now validates media/event references and publishing rights,
then saves the album, English translation, ordered media placements, slug
history and audit in one database transaction. Omitting `items` in PATCH
preserves them; an explicit empty array removes placements, never assets/files.
The existing EDITOR policy allows draft creation/editing but not publishing.
Editing already-published content still follows the existing `.edit` policy.

Only PUBLISHED, non-deleted albums are returned by public list/detail and nested
event Gallery data. Public cache invalidation covers old/new slugs and shared
Gallery/event tags. The public Gallery page now lists all published albums,
using the existing collection-card design instead of showing only one featured
album.

## Changed files

- `app/admin/actions.ts`: complete form payload and field-error mapping.
- `app/api/v1/[...path]/route.ts`: Gallery POST/PATCH/actions and admin read model.
- `server/services/gallery.ts`: transactional persistence/validation/permissions.
- `server/validators/api.ts`: create/update/item contracts.
- `components/admin/form/ResourceForm.tsx`: immediate submit lock, retained input/errors and saved ID.
- `server/audit/log.ts`: optional transaction client for atomic Gallery audit.
- `prisma/schema.prisma` and `prisma/migrations/20261003120000_gallery_image_alt_text/migration.sql`: placement alt text.
- `server/services/public.ts`, `server/cache/public-revalidation.ts`: published-only read models and cache invalidation.
- `app/gallery/page.tsx`, `components/gallery/RelatedCollections.tsx`: published album listing with existing cards.
- `tests/unit/gallery-validation.test.ts`, `tests/e2e/gallery-albums.spec.ts`, `tests/fixtures/gallery-qa.mjs`, `playwright.config.ts`, `docker/compose.gallery-qa.yml`: reproducible isolated QA.

## Verification results

- `npx tsc --noEmit`: passed.
- `npm run lint`: 0 errors, 128 warnings; warnings are non-blocking (mostly existing `any`/unused fields).
- `npm test`: 20 tests passed, including 12 new Gallery contract cases.
- `npm run test:e2e`: all 4 tests passed using installed Chrome and Docker/PostgreSQL/Redis.
- Production `next build` via the repository's Node 22 Dockerfile: passed.
- Migration deployed successfully to isolated `destiny_gallery_qa`, without reset.
- Manual Chrome: required-field validation; existing-library selection; Draft persistence after reload;
  Draft public 404; Publish and visible public caption/alt; reorder/removal; duplicate-slug error retaining
  input; change back to Draft hiding the formerly published page; full published album listing.
- Real API: a 15-image album; missing required fields; nonexistent/non-image media;
  nonexistent event; foreign placement IDs; failed mutations preserve stored album;
  editor/viewer/anonymous permissions; CSRF; two concurrent identical submissions
  produce exactly one album; published slug redirect; archive hidden from public.
- Removing an album image leaves its Media Library asset accessible. Shared asset alt is not overwritten.

The initial test attempts exposed test-selector mismatches and a Windows CRLF
entrypoint issue; both were corrected before the final run. QA compose uses the
same migrate/start commands with a portable shell entrypoint; production Docker
files were not changed. Repeated QA logins briefly hit the existing rate limit;
only the three QA login counters in the dedicated QA Redis were reset. Production
rate limiting was not changed.

## Reproduce locally (PowerShell)

Never point these tests/fixtures at production. The fixture requires
`GALLERY_QA=1` and database name `destiny_gallery_qa`; tests also require loopback
port 43291. QA credentials in compose are test-only and must not be deployed.

```powershell
docker compose -f docker/compose.gallery-qa.yml up -d --build
docker compose -f docker/compose.gallery-qa.yml exec -T app npm run db:seed:preview
Get-Content -Raw tests/fixtures/gallery-qa.mjs | docker compose -f docker/compose.gallery-qa.yml exec -T app node --input-type=module
$env:GALLERY_QA='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:43291'
$env:PLAYWRIGHT_CHANNEL='chrome'
npm run test:e2e
```

Admin: `http://127.0.0.1:43291/admin/login`. Local QA admin:
`qa-admin@example.test` / `Gallery-QA-Only-2026!`. Editor/viewer accounts use
`qa-editor@example.test` / `qa-viewer@example.test` with the same QA password.
No new image files are uploaded by these tests: existing seeded library assets
are reused. The QA stack does not mount the original project's database/media
volumes. Stop it with `docker compose -f docker/compose.gallery-qa.yml stop`
when no longer needed (do not remove volumes to preserve QA evidence).

## Migration and deployment handoff (not executed)

The additive migration adds three nullable TEXT columns: GalleryAlbum cover/hero
placement alt, and GalleryMedia placement alt. Existing rows/images/content remain
unchanged. No data backfill, seed, reset, column removal or file deletion is needed.
PostgreSQL ALTER TABLE briefly acquires table locks; take a current DB backup and
deploy during an appropriate maintenance window. Older app code can run against
the added columns if binary rollback is needed; leave the migration applied.

After reviewing/merging `codex/gallery-album-save` into the deployment branch,
use the existing production environment/secrets, database and media volumes.
Do not use QA compose or run `db:seed:preview` on production.

For the repository's documented Docker deployment:

```sh
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker up -d app
docker compose --env-file .env.docker logs --tail 100 app
```

The existing entrypoint runs `prisma migrate deploy` before serving requests
when `RUN_DB_MIGRATIONS=true` (default). If it is explicitly disabled, apply
`npm run db:migrate:deploy` using the newly built image and the production DB
before starting the new application. Rebuild the client with the updated Prisma
schema; the Dockerfile already runs `db:generate`.

For a non-Docker deployment, run `npm ci`, `npm run db:generate`,
`npm run db:migrate:deploy`, then the existing build/restart workflow, all against
the intended environment. Build the production image from a Linux/LF checkout,
or verify `docker/entrypoint.sh` uses LF before deployment; a Windows CRLF checkout
cannot execute the existing shebang unchanged.

Post-deploy checklist:

- Migration is recorded as applied and app health responds normally.
- Create a real intended album with existing uploaded images, save Draft, reload/edit it.
- Draft is absent from `/gallery`, `/api/v1/gallery`, direct detail URLs and event Gallery data.
- Publish that approved album; check list/detail images, order, captions and alt, then update/reorder.
- Remove a placement and confirm its file remains in Media Library.
- Confirm invalid input/slug/media failures retain form input; check editor cannot Publish.
- Confirm existing MAYA/NICOLE CHEN/RYAL images, DESTINY poster/hero and library upload count are unchanged.
- Do not create disposable test content on production.

No remaining local Gallery blocker. Production verification is intentionally
pending deployment. Dependency installation also reports 22 existing audit
findings (5 moderate, 15 high, 2 critical); no dependency upgrade or `audit fix`
was attempted in this narrowly scoped bug fix.
