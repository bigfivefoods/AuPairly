-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "suspendReason" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "CityWaitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "slug" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CityWaitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CityWaitlist_email_city_key" ON "CityWaitlist"("email", "city");
CREATE INDEX IF NOT EXISTS "CityWaitlist_slug_idx" ON "CityWaitlist"("slug");
CREATE INDEX IF NOT EXISTS "CityWaitlist_createdAt_idx" ON "CityWaitlist"("createdAt");
