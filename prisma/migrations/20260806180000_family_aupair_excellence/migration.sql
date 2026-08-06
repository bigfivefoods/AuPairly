-- AlterTable User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avgResponseMinutes" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "householdOwnerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "partnerInviteToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_partnerInviteToken_key" ON "User"("partnerInviteToken");
CREATE INDEX IF NOT EXISTS "User_householdOwnerId_idx" ON "User"("householdOwnerId");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_householdOwnerId_fkey"
    FOREIGN KEY ("householdOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AuPairProfile
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "workRights" TEXT;
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "willingRelocate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "relocateCities" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "certificates" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "boostViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "boostLikes" INTEGER NOT NULL DEFAULT 0;

-- FamilyProfile
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "schoolArea" TEXT;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "drivingRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "lifestyleNotes" TEXT;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "boostViews" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "boostLikes" INTEGER NOT NULL DEFAULT 0;

-- Placement
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "offerJson" TEXT;
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "offerAcceptedParentAt" TIMESTAMP(3);
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "offerAcceptedAupairAt" TIMESTAMP(3);
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "trialFeedback" TEXT;

-- SupportTicket
ALTER TABLE "SupportTicket" ADD COLUMN IF NOT EXISTS "slaHours" INTEGER NOT NULL DEFAULT 48;

-- SavedSearch
CREATE TABLE IF NOT EXISTS "SavedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "alertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SavedSearch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SavedSearch_userId_idx" ON "SavedSearch"("userId");
DO $$ BEGIN
  ALTER TABLE "SavedSearch" ADD CONSTRAINT "SavedSearch_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AvailabilitySlot
CREATE TABLE IF NOT EXISTS "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_userId_startDate_idx" ON "AvailabilitySlot"("userId", "startDate");
DO $$ BEGIN
  ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ShortlistItem
CREATE TABLE IF NOT EXISTS "ShortlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetProfileId" TEXT,
    "targetType" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShortlistItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ShortlistItem_userId_targetUserId_key" ON "ShortlistItem"("userId", "targetUserId");
CREATE INDEX IF NOT EXISTS "ShortlistItem_userId_idx" ON "ShortlistItem"("userId");
DO $$ BEGIN
  ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ShortlistItem" ADD CONSTRAINT "ShortlistItem_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ApplicationPacket
CREATE TABLE IF NOT EXISTS "ApplicationPacket" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "message" TEXT,
    "packetJson" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ApplicationPacket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApplicationPacket_toUserId_status_idx" ON "ApplicationPacket"("toUserId", "status");
CREATE INDEX IF NOT EXISTS "ApplicationPacket_fromUserId_idx" ON "ApplicationPacket"("fromUserId");
DO $$ BEGIN
  ALTER TABLE "ApplicationPacket" ADD CONSTRAINT "ApplicationPacket_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "ApplicationPacket" ADD CONSTRAINT "ApplicationPacket_toUserId_fkey"
    FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- InterviewProposal
CREATE TABLE IF NOT EXISTS "InterviewProposal" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "note" TEXT,
    "meetingUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InterviewProposal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "InterviewProposal_conversationId_idx" ON "InterviewProposal"("conversationId");
CREATE INDEX IF NOT EXISTS "InterviewProposal_fromUserId_idx" ON "InterviewProposal"("fromUserId");
DO $$ BEGIN
  ALTER TABLE "InterviewProposal" ADD CONSTRAINT "InterviewProposal_fromUserId_fkey"
    FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- PlacementCheckIn
CREATE TABLE IF NOT EXISTS "PlacementCheckIn" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response" TEXT,
    "rating" INTEGER,
    "respondedAt" TIMESTAMP(3),
    CONSTRAINT "PlacementCheckIn_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PlacementCheckIn_placementId_dayOffset_key" ON "PlacementCheckIn"("placementId", "dayOffset");
CREATE INDEX IF NOT EXISTS "PlacementCheckIn_placementId_idx" ON "PlacementCheckIn"("placementId");
DO $$ BEGIN
  ALTER TABLE "PlacementCheckIn" ADD CONSTRAINT "PlacementCheckIn_placementId_fkey"
    FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- BoostEvent
CREATE TABLE IF NOT EXISTS "BoostEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "messages" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BoostEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BoostEvent_userId_endsAt_idx" ON "BoostEvent"("userId", "endsAt");
DO $$ BEGIN
  ALTER TABLE "BoostEvent" ADD CONSTRAINT "BoostEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
