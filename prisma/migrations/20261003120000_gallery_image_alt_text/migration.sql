-- Per-placement alt text: existing Media Library assets and albums are unchanged.
ALTER TABLE "gallery_albums" ADD COLUMN "cover_alt_text" TEXT;
ALTER TABLE "gallery_albums" ADD COLUMN "hero_alt_text" TEXT;
ALTER TABLE "gallery_media" ADD COLUMN "alt_text" TEXT;
