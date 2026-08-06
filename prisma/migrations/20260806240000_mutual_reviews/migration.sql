-- Airbnb-style mutual reviews: category scores + double-blind publish
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "communication" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "reliability" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "respect" INTEGER;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "recommend" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "privateNote" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "response" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "respondedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "context" TEXT NOT NULL DEFAULT 'MESSAGE';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "placementId" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: existing reviews are already public
UPDATE "Review" SET "publishedAt" = "createdAt" WHERE "publishedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "Review_targetId_publishedAt_idx" ON "Review"("targetId", "publishedAt");
CREATE INDEX IF NOT EXISTS "Review_authorId_createdAt_idx" ON "Review"("authorId", "createdAt");
