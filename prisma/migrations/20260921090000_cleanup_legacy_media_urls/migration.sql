-- Legacy bootstrap runs created duplicate media rows under public/assets/.
-- The canonical seed rows use assets/ and are still referenced by content.
-- Retain the legacy records for audit/recovery, but stop exposing unreferenced
-- broken URLs to the media library and public consumers.
UPDATE "media_assets" AS m
SET "deleted_at" = COALESCE("deleted_at", CURRENT_TIMESTAMP)
WHERE m."storage_key" LIKE 'public/assets/%'
  AND NOT EXISTS (SELECT 1 FROM "content_pages" x WHERE x."hero_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "content_page_translations" x WHERE x."og_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "events" x WHERE x."poster_media_id" = m."id" OR x."hero_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "event_translations" x WHERE x."og_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "artists" x WHERE x."portrait_media_id" = m."id" OR x."hero_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "artist_media" x WHERE x."media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "bottle_options" x WHERE x."media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "news_articles" x WHERE x."hero_media_id" = m."id" OR x."card_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "gallery_albums" x WHERE x."cover_media_id" = m."id" OR x."hero_media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "gallery_media" x WHERE x."media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "product_images" x WHERE x."media_id" = m."id")
  AND NOT EXISTS (SELECT 1 FROM "partners" x WHERE x."logo_media_id" = m."id" OR x."image_media_id" = m."id");
