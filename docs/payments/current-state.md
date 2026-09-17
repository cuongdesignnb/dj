# Square payments: current state

## Provider and configuration

Square is the only active payment provider. The server uses the `square` npm
SDK (`46.0.0`) with API version `2026-09-16`.

Required server variables:

```text
PAYMENT_PROVIDER=square
SQUARE_ENVIRONMENT=sandbox|production
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
SQUARE_WEBHOOK_SIGNATURE_KEY=
SQUARE_WEBHOOK_NOTIFICATION_URL=https://example.com/api/v1/webhooks/square
NEXT_PUBLIC_SQUARE_APPLICATION_ID=
NEXT_PUBLIC_SQUARE_LOCATION_ID=
SQUARE_API_VERSION=2026-09-16
CHECKOUT_HOLD_MINUTES=15
```

`SQUARE_ACCESS_TOKEN` and `SQUARE_WEBHOOK_SIGNATURE_KEY` are server-only. The
browser receives only the application ID, location ID, environment-specific
Web Payments SDK URL, amount and currency.

The admin integration status calls `LocationsApi.getLocation` as a preflight.
It reports the configured location, currency, `ACTIVE` status and
`CREDIT_CARD_PROCESSING` capability without returning credentials.

The payment page loads `https://sandbox.web.squarecdn.com/v1/square.js` in
Sandbox or `https://web.squarecdn.com/v1/square.js` in Production. Its CSP is
limited to Square's documented script, frame, connect and font origins. Card
fields require a secure context in production: deploy the payment page over
HTTPS and register the exact public webhook URL in the Square Developer
Dashboard.

## Local source of truth

The database owns the customer-facing business state. Square IDs and statuses
are provider evidence only.

| Model | Purpose |
| --- | --- |
| `CheckoutIntent` | Opaque checkout ID, canonical amount/currency, target aggregate, expiry and Square order ID. |
| `PaymentAttempt` | One retry/idempotency key and provider attempt status. |
| `Payment` | Square payment ID, amount, location, provider status and exactly one business target. |
| `TicketPurchase`, `TicketPurchaseItem` | Ticket order and server-priced tier quantities. |
| `TicketHold` | Temporary ticket capacity reservation. |
| `IssuedTicket` | One opaque QR token per paid ticket; only a SHA-256 code hash is used for verification. |
| `VipBooking`, `VipBoothHold` | Payable VIP booking and temporary booth reservation. Request-only bookings remain `BookingRequest`. |
| `Refund` | Square refund request/status and partial-refund accounting. |
| `SquareWebhookEvent` | Raw event hash/payload and unique event ID for webhook idempotency. |
| `OutboxEvent` | Post-payment email/fulfilment work without making the provider callback do external work. |

The `Payment` finalizer is the only path allowed to confirm merchandise,
tickets or VIP bookings. It exits without side effects unless
`Payment.status = COMPLETED`, and it is safe to call again.

## Flows

### Merchandise

`POST /api/v1/checkout/session` accepts product/variant IDs, quantities, an
optional promo code and an opaque client reference. It re-prices from the
published catalogue, creates a pending `Order` and `CheckoutIntent`, then
redirects to `/checkout/pay/{checkoutId}`. The browser sends only the Square
single-use `sourceId`, optional buyer-verification token and a retry-scoped
idempotency key. The server creates a Square Order and then a Square Payment.

### Tickets

`POST /api/v1/checkout/ticket-intent` validates event/tier availability, locks
the logical hold operation at Serializable isolation, creates a ticket
purchase and holds the requested quantity for `CHECKOUT_HOLD_MINUTES`.
`COMPLETED` consumes each hold, increments sold quantity, confirms the purchase
and creates exactly one issued ticket/QR token per quantity.

### VIP

The existing `/api/v1/booking-requests` path stays request-only. A package with
`paymentMode = REQUEST_ONLY` cannot create a payment intent. Packages configured
as `FULL_PAYMENT` or `DEPOSIT` use `/api/v1/checkout/vip-intent`; booth holds
are consumed only by the completed-payment finalizer.

## Webhooks and idempotency

`POST /api/v1/webhooks/square` reads the raw request body, validates
`x-square-hmacsha256-signature` against the exact configured notification URL,
stores a unique event ID, and returns a duplicate success for an already
processed event. `payment.created` and `payment.updated` retrieve the current
payment from Square before updating local state, so out-of-order notifications
cannot roll back a completed payment. Refund events retrieve the current
refund before updating local refund/payment state.

Square Order creation uses a deterministic checkout-intent key. Each payment
attempt uses a unique retry key, and the same key can safely be replayed after
a network timeout. Raw card numbers, CVV, Square source tokens and provider
access tokens are never persisted or logged.

## Admin, refund and reconciliation

The admin sidebar exposes Payments, Ticket Purchases and VIP Bookings under the
existing `orders` permission. Payment details provide provider IDs, status,
amount, refunds, a Square reconcile action and a Square refund action. Refunds
are created in Square first; local records remain `PENDING` until the provider
reports `COMPLETED`. Partial refunds update `PARTIALLY_REFUNDED` only after the
completed refund total is known.

`POST /api/v1/admin/payments/{id}/reconcile` retrieves the current Square
payment and runs the same completed finalizer. `POST
/api/v1/admin/payments/expire-holds` releases expired ticket/booth holds and
marks expired intents; run it from a scheduler in production. Outbox rows are
the handoff point for confirmation email and fulfilment workers.

## Verification matrix

Automated local coverage should include:

- Square HMAC valid/invalid signatures, duplicate events and out-of-order payment updates.
- Finalizer gating (`PENDING`/`APPROVED` never confirm; `COMPLETED` confirms once).
- Server-side money calculation and checkout-intent expiry.
- Payment-attempt idempotency and no card-data persistence.
- Ticket capacity/hold concurrency and one-ticket-per-quantity issuance.
- Refund status transitions and partial-refund totals.
- API authentication/CSRF for admin reconcile/refund endpoints.

Sandbox card success, decline, CVV failure, postal failure, duplicate-token
and refund scenarios require real Square Sandbox credentials and a configured
Sandbox location. They are deliberately not simulated by the runtime.

## Production checklist

1. Create a Production Square application and use Production credentials and a
   Production location; confirm the location currency matches catalog prices.
2. Set an HTTPS `APP_URL`, `SQUARE_WEBHOOK_NOTIFICATION_URL`, application ID,
   location ID, access token and webhook signature key.
3. Confirm CSP headers and Web Payments SDK loading on the real HTTPS domain.
4. Subscribe the Square webhook endpoint to payment and refund events and
   verify a real signed delivery.
5. Configure a scheduler/worker for hold expiry and outbox delivery.
6. Run a small Sandbox/Production smoke payment only after the external
   credentials and seller location are verified.
