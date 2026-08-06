-- Product excellence: placements, trust, docs, agency, support, stories

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "videoIntroUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "placementVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "safetyScore" INTEGER NOT NULL DEFAULT 50;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "locale" TEXT NOT NULL DEFAULT 'en';

CREATE TABLE IF NOT EXISTS "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "branding" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Agency_slug_key" ON "Agency"("slug");

CREATE TABLE IF NOT EXISTS "Placement" (
    "id" TEXT NOT NULL,
    "parentUserId" TEXT NOT NULL,
    "aupairUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INTERESTED',
    "checklist" TEXT NOT NULL DEFAULT '{}',
    "interviewAt" TIMESTAMP(3),
    "interviewNotes" TEXT,
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "trialNotes" TEXT,
    "placedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "successFeeCents" INTEGER NOT NULL DEFAULT 250000,
    "successFeePaidAt" TIMESTAMP(3),
    "successFeeRef" TEXT,
    "contractText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Placement_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Placement_parentUserId_aupairUserId_key" ON "Placement"("parentUserId", "aupairUserId");
CREATE INDEX IF NOT EXISTS "Placement_parentUserId_status_idx" ON "Placement"("parentUserId", "status");
CREATE INDEX IF NOT EXISTS "Placement_aupairUserId_status_idx" ON "Placement"("aupairUserId", "status");

CREATE TABLE IF NOT EXISTS "ReferenceRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "refereeEmail" TEXT NOT NULL,
    "refereeName" TEXT,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rating" INTEGER,
    "comment" TEXT,
    "relationship" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReferenceRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReferenceRequest_token_key" ON "ReferenceRequest"("token");
CREATE INDEX IF NOT EXISTS "ReferenceRequest_subjectId_status_idx" ON "ReferenceRequest"("subjectId", "status");
CREATE INDEX IF NOT EXISTS "ReferenceRequest_token_idx" ON "ReferenceRequest"("token");

CREATE TABLE IF NOT EXISTS "SecureDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecureDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SecureDocument_userId_idx" ON "SecureDocument"("userId");

CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Story_expiresAt_idx" ON "Story"("expiresAt");
CREATE INDEX IF NOT EXISTS "Story_userId_idx" ON "Story"("userId");

CREATE TABLE IF NOT EXISTS "SupportTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SupportTicket_userId_status_idx" ON "SupportTicket"("userId", "status");

DO $$ BEGIN
  ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Placement" ADD CONSTRAINT "Placement_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Placement" ADD CONSTRAINT "Placement_aupairUserId_fkey" FOREIGN KEY ("aupairUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ReferenceRequest" ADD CONSTRAINT "ReferenceRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ReferenceRequest" ADD CONSTRAINT "ReferenceRequest_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "SecureDocument" ADD CONSTRAINT "SecureDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Story" ADD CONSTRAINT "Story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
