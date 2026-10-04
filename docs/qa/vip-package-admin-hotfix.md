# VIP package Admin hotfix and deployment handoff

This candidate fixes saving the existing BOOTH PACKAGE, adds a visual default package picker and bottle checklist, and preserves existing database identities and media. It has passed real Chrome and PostgreSQL QA. Production has not been changed or deployed; release and the six Admin activation steps below require a separate approval.

## Source and scope

Start: `codex/post-gallery-uat` at `b0834d8edd08880681e5cab30eb955b4b8a3b5bd`.
Candidate: `codex/vip-package-admin-save`. Use the verified pushed HEAD, not the older master branch. Resolve the exact SHA with `git rev-parse origin/codex/vip-package-admin-save` and compare with `git ls-remote origin refs/heads/codex/vip-package-admin-save`; the final task report records that SHA.

The production baseline SHA was supplied by the owner, not exposed by the health endpoint. This work used a clean managed worktree based on that commit. The unrelated dirty edits in `D:/DJ/destiny-rave` were not changed, staged or committed.

No migration, schema change, production SQL, ID rewrite, reset, seed, upload, duplicated BottleOption, fabricated booth, production request or payment was performed. Gallery and navigation implementations are unchanged by this diff.

## Root cause and complete save flow

The original `vipPackageInput` used Zod 4.6.5 `z.string().uuid()`. Before the fix, a unit test with the exact production-shaped fixture failed at `id` with `invalid_format / uuid / Invalid UUID`. The ID was `00000000-0000-0000-0000-000000000001`: canonical PostgreSQL UUID syntax but not a UUID with the version and variant bits required by this Zod validator. The fixture ID was never changed to make the test pass.

That unhandled ZodError was mapped to an HTTP 500 by the API wrapper. EventResourceEditor then read `payload.message` instead of the actual `payload.error.message`, hiding the useful error behind “Could not save row.” The old service also wrote the package before validating explicit bottle IDs and changed relations outside a transaction, permitting partial updates.

The repaired path is EventResourceEditor → shared API client → PATCH event-scoped VIP package route → existing same-origin, CSRF and `events.edit` checks → saveVipPackage → one Prisma transaction → existing audit log → event/VIP tagged cache invalidation → updated response → saved row and success toast.

The reusable database identifier validator accepts canonical 36-character hexadecimal UUIDs without enforcing RFC version/variant bits. It rejects malformed identifiers; it does not accept arbitrary strings or bypass ownership. It is used only for VIP package, selected default and bottle assignment IDs in this hotfix. Schema errors now return 422 with field errors. Missing or foreign packages remain rejected.

## Persistence and operator controls

Package updates validate fields, event ownership, bottle existence, duplicate bottle IDs and selection limits before writing. Package and explicitly supplied relations are saved atomically. Omitted `bottleOptionIds` never deletes or recreates current relations; an explicit empty array deliberately clears only those relations. Global bottles and Media Library files are never removed by package assignment.

The package form exposes name, description, dollar price, optional dollar deposit, capacity, included bottles, selection limits, payment mode, display order and Enabled. Dollar input is converted exactly to integer cents; invalid optional deposit text remains an error instead of silently clearing it. The six existing bottle choices show Enabled/Disabled and their image when present. Toggling only Enabled keeps all six assignments and the stable package ID, AUD 320000 minor units, capacity 15 and included bottles 3.

The default picker shows None and only event-owned packages with name, price and Enabled/Disabled. It stores the ID internally and preserves the selection on reload. None clears the explicit default and retains the pre-existing first-active public behavior. An explicitly disabled or missing default shows a warning and blocks public readiness; another active package is not substituted. Selecting a default never enables it.

API errors show the nested message, field details and support request ID. Failed saves retain all edits. Successful saves replace the row with the real response. The in-flight guard and disabled controls prevent repeated Save from issuing a second request. Existing RBAC and CSRF checks are unchanged.

## Verification on 4 October 2026

| Gate | Evidence |
| --- | --- |
| TypeScript | PASS, `npx tsc --noEmit` |
| ESLint | PASS, 0 errors and 118 warnings; no new lint errors |
| Unit tests | PASS, 90 tests in 7 files |
| Production build | PASS, `npm run build` inside Node 22 Docker, Next.js 16.2.9 |
| Chrome E2E and real API | PASS, all 15 tests in 1.6 minutes, no skipped QA cases |
| Stable package persistence | OFF → ON and ON → OFF; reload matches; no duplicate; unchanged price/capacity/included bottles/ID |
| Bottle relations | Omitted unchanged; explicit two then six persist; missing/duplicate IDs rejected without partial writes; relation loss 0 |
| Default picker | Event-owned selection and None persist; foreign/missing IDs rejected; disabled selection never silently switches |
| Admin errors | Real HTTP 422 displays message, field and request ID; edits remain; double-click issues one PATCH |
| RBAC and CSRF | Valid authorized save 200; anonymous 401; view-only without edit 403; missing/invalid CSRF and cross-origin 403 |
| Public cache | Primed no-active-package pages switch immediately after tagged revalidation; no global cache bypass added |
| Tables and Book Now | AUD 3200 package information, request-only/no-booth notice and booking request form; no booth selection fabricated or payment action |
| Gallery | Real Draft/Publish/edit/reorder/removal, validation/security/media-preservation and linked/unlinked event CTA regression all pass |
| Navigation | Shared Gallery menu on desktop/mobile and delayed/reduced-motion loading feedback pass |
| Production public reads | VIP and DESTINY/ECHO detail bodies identical before/after; health ready 200 with PostgreSQL/Redis OK |

The built image SHA256 is `c0dc43c4d2110fa60b3dd04cdbcc25b1b5b7cba2166c4d80e95a22f8a4252d1f`. Only documentation changed after the final application build. See `vip-package-admin-freeze.json` for exact public hashes, album IDs and restored QA package/bottle IDs.

All tests use `127.0.0.1:43291`, database `destiny_gallery_qa`, independent Redis and QA media volumes. Real Chrome was also opened through Computer Use to inspect the picker and visual package form. Screenshots in `test-results/vip-package-admin-default.jpg`, `vip-package-admin-bottles.jpg` and `vip-package-admin-error.jpg` were visually inspected. They show QA fixtures, not production. The bottle image test temporarily linked an existing QA media image; it did not upload a new image or choose production bottle artwork.

After the suite, the original QA snapshot was restored: one BOOTH PACKAGE, Enabled OFF, AUD 3200, capacity 15, three included bottles, six unchanged bottle IDs/names, default None, VIP OFF, REQUEST_ONLY and Square OFF. The two temporary ownership/default-test packages were removed only from QA, and their isolated event was archived. The prior Gallery suite creates disposable QA albums and one QA booking request; none are production records.

### Repeat the checks

Use the dedicated QA compose, never production environment variables. Existing preview fixtures, QA users, media and the stable seeded package must already exist; this hotfix did not seed or reset the QA database.

```powershell
docker compose -f docker/compose.gallery-qa.yml build app
docker compose -f docker/compose.gallery-qa.yml up -d
npx tsc --noEmit
npm run lint
npm test
$env:GALLERY_QA='1'
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:43291'
$env:PLAYWRIGHT_CHANNEL='chrome'
npm run test:e2e
```

The tests and fixture scripts require the QA opt-in, loopback port, database name and PostgreSQL service hostname. Fixtures snapshot and restore event/package/booth/bottle fields and assignments in afterAll. A killed run can interrupt cleanup; inspect the original QA state before repeating. If repeated tests exhaust login/booking rate limits, wait for the normal window or inspect and clear only exact verified QA test-account/rate keys in this isolated Redis. Never flush Redis, change the global limiter, or clear production limits.

## Deployment after separate approval

1. Confirm the approved candidate SHA equals the pushed branch HEAD and contains `b0834d8...`. Keep the current production image, checkout and configuration for rollback.
2. Take and verify a PostgreSQL backup and media-volume backup through the existing deployment process. No migration is added. Existing Gallery ALT migration must remain applied; do not seed, reset or downgrade.
3. On the existing approved Docker deployment host, check out the approved SHA in a clean deployment checkout. Retain its current `.env.docker`, Compose project, volumes, domain, ports and secrets. Do not copy the QA compose, database or credentials. Keep `docker/entrypoint.sh` LF-encoded as the current deployment expects.
4. Build the app with `docker compose --env-file .env.docker -f docker-compose.yml build app`, then replace only the app with `docker compose --env-file .env.docker -f docker-compose.yml up -d --no-deps app`. The existing entrypoint runs Prisma migrate deploy according to existing configuration; no hotfix migration is required.
5. Check GET `/api/health`, `/api/health/ready` and app logs. Then perform the owner-approved Admin configuration below. No temporary production test package, album, booking or payment is needed.

### Production activation through Admin only

Keep VIP Enabled ON, Booking Enabled ON, REQUEST_ONLY and Square OFF.

1. In DESTINY VIP Packages, enable the existing BOOTH PACKAGE and Save. Keep ID `00000000-0000-0000-0000-000000000001`, price AUD 3200, capacity 15 and included bottles 3.
2. In DESTINY VIP Settings, select BOOTH PACKAGE from Default package and Save settings. Do not copy/paste a UUID.
3. Verify the six existing assignments: Belvedere Vodka, Hennessy VS, El Jimador Tequila, Moët & Chandon, Jager and WAP Cranberry Peach.
4. Reload both Admin pages and verify Enabled, default and all six selections persist. Confirm the six global bottle names and any existing media are unchanged.
5. Read public `/tables` and GET `/api/v1/events/destiny/vip`: active BOOTH PACKAGE, correct AUD price/capacity/bottles, no generic invalid-data error. With zero real booths, “Active package exists but no booths are configured” is informational for request-only, not a save failure.
6. Read public `/book-now`: request form and request-only/no-booth notice, no confirmed reservation or payment promise. Do not submit a production test request. Recheck Gallery DESTINY 15/ECHO 9, exact order/ALT/captions/event links and Gallery menu/loading feedback.

Booths may remain zero until the owner supplies the real layout. Do not add fabricated B1/B2/B3 fixtures or execute SQL for these activation steps.

### Rollback and outstanding release decisions

Redeploy the saved image/source at `b0834d8edd08880681e5cab30eb955b4b8a3b5bd` using the existing environment and volumes. There is no hotfix database downgrade. Rollback restores the old package Save validator/UI bug; it must not be described as retaining this hotfix. Keep all package IDs, assignments, media and prior Gallery migrations.

Scoped hotfix engineering bugs: P0 0, P1 0, P2 0 on the tested candidate. Production is still on the owner's previous code until approved deployment, so production Save is not claimed fixed yet. The earlier baseline handoff records 22 dependency audit findings (5 moderate, 15 high, 2 critical), an independent release-security review item. No dependencies or lockfile were changed here, and that audit was not rerun or marked resolved. Real booth layout, content/providers and owner business configuration are separate release decisions.

## Changed files

18 files relative to `b0834d8...`, including two new handoff/evidence documents.

```text
app/api/v1/[...path]/route.ts
components/admin/cms/EventResourceEditor.tsx
components/admin/cms/EventSettingsEditor.tsx
components/admin/cms/VipPackageFields.tsx
components/admin/ui/ApiErrorNotice.tsx
lib/admin/common/types.ts
lib/admin/events/vip-package.ts
lib/api/client.ts
lib/vip/http.ts
server/services/cms.ts
server/services/public.ts
server/validators/identifiers.ts
tests/e2e/vip-package-admin.spec.ts
tests/fixtures/vip-package-admin-qa.mjs
tests/unit/vip-package-admin.test.ts
tests/unit/vip-state.test.ts
docs/qa/vip-package-admin-hotfix.md
docs/qa/vip-package-admin-freeze.json
```
