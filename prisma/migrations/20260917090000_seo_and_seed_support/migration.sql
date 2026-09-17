-- Additive SEO and seed support migration. Existing content is preserved.

ALTER TYPE "TicketAvailabilityStatus" ADD VALUE IF NOT EXISTS 'UNKNOWN';
ALTER TYPE "TicketAvailabilityStatus" ADD VALUE IF NOT EXISTS 'ON_REQUEST';

CREATE TABLE "locales" (
    "code" VARCHAR(2) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "locales_pkey" PRIMARY KEY ("code")
);

ALTER TABLE "content_pages"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "news_articles"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "gallery_albums"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "legal_documents"
  ADD COLUMN IF NOT EXISTS "seo_title" TEXT,
  ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
  ADD COLUMN IF NOT EXISTS "og_media_id" UUID,
  ADD COLUMN IF NOT EXISTS "canonical_override" TEXT,
  ADD COLUMN IF NOT EXISTS "indexable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "follow_links" BOOLEAN NOT NULL DEFAULT true;
