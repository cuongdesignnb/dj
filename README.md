# Destiny / Connection Rave

Next.js 16 website and admin backend for the Destiny / Connection Rave event.
Runtime data comes from PostgreSQL through Prisma; public pages and the admin
panel communicate through the versioned `/api/v1` contract.

## Stack

- Next.js 16, React, TypeScript and Tailwind CSS
- PostgreSQL 16 with Prisma migrations and seed data
- Redis 7 for rate limiting (with a development-only in-memory fallback)
- Opaque database sessions, CSRF protection, Argon2id passwords, RBAC and audit logs
- Square Web Payments checkout, Orders, Payments, webhooks and refunds
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

### Local admin and checkout smoke test

With the Docker defaults, open [http://localhost:43171/admin/login](http://localhost:43171/admin/login) and use `admin@example.test` / `local-admin-password-change-me`. Change both values before any shared or production deployment.

Paid flows do not accept card numbers from the API. The storefront creates a
server-priced checkout intent first, then Square Web Payments tokenizes the
card in `/checkout/pay/{checkoutId}`. For example:

```powershell
Invoke-RestMethod http://localhost:43171/api/v1/checkout/session `
  -Method Post -ContentType 'application/json' `
  -Body '{"items":[{"productId":"<published-product-uuid>","quantity":1}],"customerEmail":"test@example.com"}'
```

Ticket and VIP intents use `/api/v1/checkout/ticket-intent` and
`/api/v1/checkout/vip-intent`. A 422 means the content is not currently
published/online-sale enabled; a 409 means the business state (for example a
request-only VIP package) intentionally prevents payment. A real card payment
requires Square Sandbox credentials, location ID, application ID, webhook
signature key and a reachable HTTPS webhook URL.

## Quality checks

```powershell
npm run lint
npm test
npm run build
```

API documentation is in [docs/api/openapi.yaml](docs/api/openapi.yaml), and the
database map is in [docs/database/ERD.md](docs/database/ERD.md).
