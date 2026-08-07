-- User blocks, city hangouts, host urgent + preferred areas, referral reward flag

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralRewardGranted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "FamilyProfile"
  ADD COLUMN IF NOT EXISTS "isUrgent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "urgentUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "preferredAreas" TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS "FamilyProfile_isUrgent_status_idx"
  ON "FamilyProfile"("isUrgent", "status");

CREATE TABLE IF NOT EXISTS "UserBlock" (
  "id" TEXT NOT NULL,
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blockerId_blockedId_key"
  ON "UserBlock"("blockerId", "blockedId");

CREATE INDEX IF NOT EXISTS "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserBlock_blockerId_fkey') THEN
    ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey"
      FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserBlock_blockedId_fkey') THEN
    ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey"
      FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "CityHangout" (
  "id" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CityHangout_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CityHangout_city_country_createdAt_idx"
  ON "CityHangout"("city", "country", "createdAt");

CREATE INDEX IF NOT EXISTS "CityHangout_authorId_idx" ON "CityHangout"("authorId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CityHangout_authorId_fkey') THEN
    ALTER TABLE "CityHangout" ADD CONSTRAINT "CityHangout_authorId_fkey"
      FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
