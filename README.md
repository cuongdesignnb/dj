# Destiny / Connection Rave

Next.js 16 website and admin backend for the Destiny / Connection Rave event.
Runtime data comes from PostgreSQL through Prisma; public pages and the admin
panel communicate through the versioned `/api/v1` contract.

## Stack

- Next.js 16, React, TypeScript and Tailwind CSS
- PostgreSQL 16 with Prisma migrations and seed data
- Redis 7 for rate limiting (with a development-only in-memory fallback)
- Opaque database sessions, CSRF protection, Argon2id passwords, RBAC and audit logs
- Stripe hosted checkout and idempotent webhook processing
- Local media storage by default, with S3-compatible configuration available

## Local development

```powershell
Copy-Item .env.example .env.local
npm install
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).
Set `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET` and `CSRF_SECRET` before
starting the app. The seed administrator is controlled by `ADMIN_SEED_EMAIL`
and `ADMIN_SEED_PASSWORD`.

## Docker deployment

Copy `.env.docker.example` to `.env.docker`, set production secrets, then run:

```powershell
docker compose up -d --build
```

The app is exposed on `127.0.0.1:43171` by default. PostgreSQL and Redis are
internal-only services. The development override exposes them locally on
`45473` and `46337` when inspection is needed:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

The container applies `prisma migrate deploy` before starting Next.js when
`RUN_DB_MIGRATIONS=true`.

## Quality checks

```powershell
npm run lint
npm test
npm run build
```

API documentation is in [docs/api/openapi.yaml](docs/api/openapi.yaml), and the
database map is in [docs/database/ERD.md](docs/database/ERD.md).
