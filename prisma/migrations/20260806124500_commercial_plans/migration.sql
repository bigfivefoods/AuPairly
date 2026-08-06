-- Commercial freemium (usage limits + paid membership)

-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

-- AlterTable AuPairProfile
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);

-- AlterTable FamilyProfile
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "boostedUntil" TIMESTAMP(3);

-- CreateTable Subscription
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable Swipe
CREATE TABLE IF NOT EXISTS "Swipe" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Swipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable UsageCounter
CREATE TABLE IF NOT EXISTS "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_userId_key" ON "Subscription"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Swipe_fromUserId_toUserId_key" ON "Swipe"("fromUserId", "toUserId");
CREATE INDEX IF NOT EXISTS "Swipe_toUserId_idx" ON "Swipe"("toUserId");
CREATE INDEX IF NOT EXISTS "Swipe_fromUserId_createdAt_idx" ON "Swipe"("fromUserId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "UsageCounter_userId_action_dayKey_key" ON "UsageCounter"("userId", "action", "dayKey");
CREATE INDEX IF NOT EXISTS "UsageCounter_userId_dayKey_idx" ON "UsageCounter"("userId", "dayKey");

-- Foreign keys (ignore if exist via DO block)
DO $$ BEGIN
  ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Swipe" ADD CONSTRAINT "Swipe_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
