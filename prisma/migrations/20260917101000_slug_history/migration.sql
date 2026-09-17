-- Published public slugs are retained so old URLs can permanently redirect.
CREATE TABLE "slug_history" (
    "id" UUID NOT NULL,
    "entity_type" VARCHAR(40) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_slug" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "slug_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "slug_history_entity_type_old_slug_key" ON "slug_history"("entity_type", "old_slug");
CREATE INDEX "slug_history_entity_type_entity_id_idx" ON "slug_history"("entity_type", "entity_id");
