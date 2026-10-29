-- CreateTable
CREATE TABLE "event_reviews" (
    "id" UUID NOT NULL,
    "event_id" UUID,
    "author_name" VARCHAR(80) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_reviews_status_created_at_idx" ON "event_reviews"("status", "created_at");

-- CreateIndex
CREATE INDEX "event_reviews_event_id_idx" ON "event_reviews"("event_id");

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

