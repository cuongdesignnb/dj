-- CMS page content and database-backed navigation.
CREATE TYPE "TicketSaleStatus" AS ENUM ('COMING_SOON', 'ON_SALE', 'PAUSED', 'SOLD_OUT', 'ENDED');
CREATE TYPE "MenuStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "MenuItemType" AS ENUM ('INTERNAL_ROUTE', 'CUSTOM_URL', 'HASH_ANCHOR', 'NO_LINK');
CREATE TYPE "MenuLocationKey" AS ENUM ('HEADER_PRIMARY', 'HEADER_CTA', 'MOBILE_PRIMARY', 'FOOTER_QUICK', 'FOOTER_LEGAL', 'FOOTER_SECONDARY');

ALTER TABLE "events"
  ADD COLUMN "ticketing_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ticket_sale_status" "TicketSaleStatus" NOT NULL DEFAULT 'COMING_SOON',
  ADD COLUMN "ticket_currency" CHAR(3) NOT NULL DEFAULT 'AUD',
  ADD COLUMN "ticket_online_sales_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ticket_door_sales_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ticket_capacity_tracking" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ticket_sale_start" TIMESTAMP(3),
  ADD COLUMN "ticket_sale_end" TIMESTAMP(3),
  ADD COLUMN "ticket_square_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ticket_external_provider_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ticket_provider_name" TEXT,
  ADD COLUMN "ticket_provider_url" TEXT,
  ADD COLUMN "ticket_provider_event_id" TEXT,
  ADD COLUMN "vip_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "vip_availability_mode" VARCHAR(30) NOT NULL DEFAULT 'REQUEST_ONLY',
  ADD COLUMN "vip_booking_enabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "vip_default_package_id" UUID,
  ADD COLUMN "vip_request_expiry_minutes" INTEGER NOT NULL DEFAULT 1440,
  ADD COLUMN "vip_booth_hold_minutes" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "vip_currency" CHAR(3) NOT NULL DEFAULT 'AUD',
  ADD COLUMN "vip_square_enabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "ticket_tiers"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "min_quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "max_quantity" INTEGER,
  ADD COLUMN "default_quantity" INTEGER,
  ADD COLUMN "highlighted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vip_packages"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "min_bottle_selection" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "max_bottle_selection" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "vip_booths"
  ADD COLUMN "label" TEXT,
  ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bottle_options"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "category" TEXT;

CREATE TABLE "page_contents" (
  "id" UUID NOT NULL,
  "key" VARCHAR(180) NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "page_contents_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "page_contents_key_key" ON "page_contents"("key");
CREATE INDEX "page_contents_status_idx" ON "page_contents"("status");

CREATE TABLE "page_content_translations" (
  "id" UUID NOT NULL,
  "page_content_id" UUID NOT NULL,
  "locale" VARCHAR(2) NOT NULL,
  "content_json" JSONB NOT NULL,
  "seo_title" TEXT,
  "seo_description" TEXT,
  "og_image_url" TEXT,
  CONSTRAINT "page_content_translations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "page_content_translations_page_content_id_locale_key" ON "page_content_translations"("page_content_id", "locale");
ALTER TABLE "page_content_translations" ADD CONSTRAINT "page_content_translations_page_content_id_fkey" FOREIGN KEY ("page_content_id") REFERENCES "page_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "menus" (
  "id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "status" "MenuStatus" NOT NULL DEFAULT 'DRAFT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "menus_key_key" ON "menus"("key");

CREATE TABLE "menu_items" (
  "id" UUID NOT NULL,
  "menu_id" UUID NOT NULL,
  "parent_id" UUID,
  "item_type" "MenuItemType" NOT NULL,
  "label_en" TEXT NOT NULL,
  "label_vi" TEXT,
  "route_key" VARCHAR(180),
  "custom_url" TEXT,
  "anchor" TEXT,
  "target" VARCHAR(20) NOT NULL DEFAULT '_self',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "icon" TEXT,
  "badge" TEXT,
  "visibility_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "menu_items_menu_id_parent_id_sort_order_idx" ON "menu_items"("menu_id", "parent_id", "sort_order");
CREATE INDEX "menu_items_route_key_idx" ON "menu_items"("route_key");
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "menu_locations" (
  "id" UUID NOT NULL,
  "location_key" "MenuLocationKey" NOT NULL,
  "menu_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "menu_locations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "menu_locations_location_key_key" ON "menu_locations"("location_key");
ALTER TABLE "menu_locations" ADD CONSTRAINT "menu_locations_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
