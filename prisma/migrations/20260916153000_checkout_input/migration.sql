-- Allow hosted checkout to collect the customer email after the order
-- is created, and retain the idempotency reference sent by the storefront.
ALTER TABLE "orders" ALTER COLUMN "customer_email" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "client_reference" VARCHAR(80);
CREATE UNIQUE INDEX "orders_client_reference_key" ON "orders"("client_reference");
