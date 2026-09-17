-- Square is the only active payment provider. Provider state is stored
-- separately from the business aggregates and finalized only at COMPLETED.

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIALLY_REFUNDED';

CREATE TYPE "CheckoutIntentKind" AS ENUM ('MERCHANDISE', 'TICKET', 'VIP');
CREATE TYPE "CheckoutIntentStatus" AS ENUM ('OPEN', 'PROCESSING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "PaymentAttemptStatus" AS ENUM ('CREATED', 'PENDING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "TicketPurchaseStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "TicketHoldStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
CREATE TYPE "TicketIssuanceStatus" AS ENUM ('ISSUED', 'VOIDED');
CREATE TYPE "VipPaymentMode" AS ENUM ('REQUEST_ONLY', 'FULL_PAYMENT', 'DEPOSIT');
CREATE TYPE "VipBookingStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "VipBoothHoldStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

ALTER TABLE "ticket_tiers"
  ADD COLUMN "capacity" INTEGER,
  ADD COLUMN "sold_quantity" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "vip_packages"
  ADD COLUMN "payment_mode" "VipPaymentMode" NOT NULL DEFAULT 'REQUEST_ONLY',
  ADD COLUMN "deposit_amount_minor" INTEGER;

ALTER TABLE "payments"
  ALTER COLUMN "order_id" DROP NOT NULL,
  ADD COLUMN "checkout_intent_id" UUID,
  ADD COLUMN "ticket_purchase_id" UUID,
  ADD COLUMN "vip_booking_id" UUID,
  ADD COLUMN "provider_order_id" TEXT,
  ADD COLUMN "idempotency_key" TEXT,
  ADD COLUMN "location_id" TEXT,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "payments_idempotency_key_key" ON "payments"("idempotency_key");
CREATE INDEX "payments_checkout_intent_id_created_at_idx" ON "payments"("checkout_intent_id", "created_at");
CREATE INDEX "payments_ticket_purchase_id_created_at_idx" ON "payments"("ticket_purchase_id", "created_at");
CREATE INDEX "payments_vip_booking_id_created_at_idx" ON "payments"("vip_booking_id", "created_at");

CREATE TABLE "checkout_intents" (
    "id" UUID NOT NULL,
    "kind" "CheckoutIntentKind" NOT NULL,
    "status" "CheckoutIntentStatus" NOT NULL DEFAULT 'OPEN',
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "customer_email" VARCHAR(320),
    "client_reference" VARCHAR(80),
    "provider_order_id" TEXT,
    "order_id" UUID,
    "ticket_purchase_id" UUID,
    "vip_booking_id" UUID,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "checkout_intents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "checkout_intents_one_target_check" CHECK ((("order_id" IS NOT NULL)::int + ("ticket_purchase_id" IS NOT NULL)::int + ("vip_booking_id" IS NOT NULL)::int) = 1)
);

CREATE UNIQUE INDEX "checkout_intents_order_id_key" ON "checkout_intents"("order_id");
CREATE UNIQUE INDEX "checkout_intents_ticket_purchase_id_key" ON "checkout_intents"("ticket_purchase_id");
CREATE UNIQUE INDEX "checkout_intents_vip_booking_id_key" ON "checkout_intents"("vip_booking_id");
CREATE INDEX "checkout_intents_status_expires_at_idx" ON "checkout_intents"("status", "expires_at");
CREATE INDEX "checkout_intents_kind_created_at_idx" ON "checkout_intents"("kind", "created_at");

CREATE TABLE "ticket_purchases" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" VARCHAR(320) NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "TicketPurchaseStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ticket_purchases_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ticket_purchases_event_id_created_at_idx" ON "ticket_purchases"("event_id", "created_at");
CREATE INDEX "ticket_purchases_status_expires_at_idx" ON "ticket_purchases"("status", "expires_at");

CREATE TABLE "ticket_purchase_items" (
    "id" UUID NOT NULL,
    "ticket_purchase_id" UUID NOT NULL,
    "ticket_tier_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "line_total_minor" INTEGER NOT NULL,
    CONSTRAINT "ticket_purchase_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ticket_purchase_items_ticket_purchase_id_idx" ON "ticket_purchase_items"("ticket_purchase_id");
CREATE INDEX "ticket_purchase_items_ticket_tier_id_idx" ON "ticket_purchase_items"("ticket_tier_id");

CREATE TABLE "ticket_holds" (
    "id" UUID NOT NULL,
    "ticket_purchase_id" UUID NOT NULL,
    "ticket_tier_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "TicketHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ticket_holds_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ticket_holds_ticket_tier_id_status_expires_at_idx" ON "ticket_holds"("ticket_tier_id", "status", "expires_at");
CREATE INDEX "ticket_holds_ticket_purchase_id_idx" ON "ticket_holds"("ticket_purchase_id");

CREATE TABLE "issued_tickets" (
    "id" UUID NOT NULL,
    "ticket_purchase_id" UUID NOT NULL,
    "ticket_tier_id" UUID NOT NULL,
    "ticket_token" TEXT NOT NULL,
    "ticket_code_hash" TEXT NOT NULL,
    "status" "TicketIssuanceStatus" NOT NULL DEFAULT 'ISSUED',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "issued_tickets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "issued_tickets_ticket_token_key" ON "issued_tickets"("ticket_token");
CREATE UNIQUE INDEX "issued_tickets_ticket_code_hash_key" ON "issued_tickets"("ticket_code_hash");
CREATE INDEX "issued_tickets_ticket_purchase_id_idx" ON "issued_tickets"("ticket_purchase_id");

CREATE TABLE "vip_bookings" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "vip_package_id" UUID NOT NULL,
    "booth_id" UUID,
    "customer_name" TEXT NOT NULL,
    "customer_email" VARCHAR(320) NOT NULL,
    "phone" TEXT,
    "group_size" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "amount_due_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "VipBookingStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vip_bookings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "vip_bookings_event_id_created_at_idx" ON "vip_bookings"("event_id", "created_at");
CREATE INDEX "vip_bookings_status_expires_at_idx" ON "vip_bookings"("status", "expires_at");

CREATE TABLE "vip_booth_holds" (
    "id" UUID NOT NULL,
    "booth_id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "status" "VipBoothHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "vip_booth_holds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "vip_booth_holds_booking_id_key" ON "vip_booth_holds"("booking_id");
CREATE INDEX "vip_booth_holds_booth_id_status_expires_at_idx" ON "vip_booth_holds"("booth_id", "status", "expires_at");

CREATE TABLE "payment_attempts" (
    "id" UUID NOT NULL,
    "checkout_intent_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_order_id" TEXT,
    "provider_payment_id" TEXT,
    "status" "PaymentAttemptStatus" NOT NULL DEFAULT 'CREATED',
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "payment_attempts_idempotency_key_key" ON "payment_attempts"("idempotency_key");
CREATE INDEX "payment_attempts_checkout_intent_id_created_at_idx" ON "payment_attempts"("checkout_intent_id", "created_at");
CREATE INDEX "payment_attempts_provider_payment_id_idx" ON "payment_attempts"("provider_payment_id");

CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "provider_refund_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refunds_provider_refund_id_key" ON "refunds"("provider_refund_id");
CREATE UNIQUE INDEX "refunds_idempotency_key_key" ON "refunds"("idempotency_key");
CREATE INDEX "refunds_payment_id_created_at_idx" ON "refunds"("payment_id", "created_at");

CREATE TABLE "square_webhook_events" (
    "id" UUID NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "square_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "square_webhook_events_event_id_key" ON "square_webhook_events"("event_id");
CREATE INDEX "square_webhook_events_status_created_at_idx" ON "square_webhook_events"("status", "created_at");

CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "checkout_intent_id" UUID,
    "type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "outbox_events_status_available_at_idx" ON "outbox_events"("status", "available_at");
CREATE INDEX "outbox_events_aggregate_id_type_idx" ON "outbox_events"("aggregate_id", "type");

ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_ticket_purchase_id_fkey" FOREIGN KEY ("ticket_purchase_id") REFERENCES "ticket_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "checkout_intents" ADD CONSTRAINT "checkout_intents_vip_booking_id_fkey" FOREIGN KEY ("vip_booking_id") REFERENCES "vip_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_purchases" ADD CONSTRAINT "ticket_purchases_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_purchase_items" ADD CONSTRAINT "ticket_purchase_items_ticket_purchase_id_fkey" FOREIGN KEY ("ticket_purchase_id") REFERENCES "ticket_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_purchase_items" ADD CONSTRAINT "ticket_purchase_items_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_holds" ADD CONSTRAINT "ticket_holds_ticket_purchase_id_fkey" FOREIGN KEY ("ticket_purchase_id") REFERENCES "ticket_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ticket_holds" ADD CONSTRAINT "ticket_holds_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "issued_tickets" ADD CONSTRAINT "issued_tickets_ticket_purchase_id_fkey" FOREIGN KEY ("ticket_purchase_id") REFERENCES "ticket_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "issued_tickets" ADD CONSTRAINT "issued_tickets_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "ticket_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vip_bookings" ADD CONSTRAINT "vip_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vip_bookings" ADD CONSTRAINT "vip_bookings_vip_package_id_fkey" FOREIGN KEY ("vip_package_id") REFERENCES "vip_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vip_bookings" ADD CONSTRAINT "vip_bookings_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "vip_booths"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vip_booth_holds" ADD CONSTRAINT "vip_booth_holds_booth_id_fkey" FOREIGN KEY ("booth_id") REFERENCES "vip_booths"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vip_booth_holds" ADD CONSTRAINT "vip_booth_holds_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "vip_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkout_intent_id_fkey" FOREIGN KEY ("checkout_intent_id") REFERENCES "checkout_intents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_ticket_purchase_id_fkey" FOREIGN KEY ("ticket_purchase_id") REFERENCES "ticket_purchases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_vip_booking_id_fkey" FOREIGN KEY ("vip_booking_id") REFERENCES "vip_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" ADD CONSTRAINT "payments_one_target_check" CHECK ((("order_id" IS NOT NULL)::int + ("checkout_intent_id" IS NOT NULL)::int + ("ticket_purchase_id" IS NOT NULL)::int + ("vip_booking_id" IS NOT NULL)::int) >= 1);
