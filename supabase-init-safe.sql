-- AuPairly schema (IDEMPOTENT) for Supabase
-- Project: bpbxjzgzyfbpkujrfzks
-- Run in: https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/sql/new
--
-- Safe to re-run: skips types/tables/indexes/FKs that already exist.
-- Fixes: ERROR 42710 type "Role" already exists

-- ── Enums ──────────────────────────────────────────────────────────
DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('AUPAIR', 'PARENT', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "VerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FILLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'READ');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "image" TEXT,
    "phone" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuPairProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "nationality" TEXT,
    "languages" TEXT NOT NULL DEFAULT '[]',
    "age" INTEGER,
    "gender" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "childcareSkills" TEXT NOT NULL DEFAULT '[]',
    "education" TEXT,
    "drivingLicense" BOOLEAN NOT NULL DEFAULT false,
    "firstAid" BOOLEAN NOT NULL DEFAULT false,
    "swimming" BOOLEAN NOT NULL DEFAULT false,
    "nonSmoker" BOOLEAN NOT NULL DEFAULT true,
    "preferredCountries" TEXT NOT NULL DEFAULT '[]',
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "weeklyHours" INTEGER,
    "pocketMoneyMin" INTEGER,
    "liveIn" BOOLEAN NOT NULL DEFAULT true,
    "city" TEXT,
    "country" TEXT,
    "coverImage" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuPairProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FamilyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "familyName" TEXT,
    "city" TEXT,
    "country" TEXT,
    "addressArea" TEXT,
    "childrenCount" INTEGER NOT NULL DEFAULT 1,
    "childrenAges" TEXT NOT NULL DEFAULT '[]',
    "childrenDetails" TEXT,
    "languages" TEXT NOT NULL DEFAULT '[]',
    "preferences" TEXT,
    "duties" TEXT NOT NULL DEFAULT '[]',
    "offers" TEXT NOT NULL DEFAULT '[]',
    "startDate" TIMESTAMP(3),
    "durationMonths" INTEGER,
    "weeklyHours" INTEGER,
    "pocketMoney" INTEGER,
    "liveIn" BOOLEAN NOT NULL DEFAULT true,
    "hasPets" BOOLEAN NOT NULL DEFAULT false,
    "petDetails" TEXT,
    "ownRoom" BOOLEAN NOT NULL DEFAULT true,
    "carProvided" BOOLEAN NOT NULL DEFAULT false,
    "coverImage" TEXT,
    "photos" TEXT NOT NULL DEFAULT '[]',
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FamilyProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- Prisma migration history (so `prisma migrate deploy` won't re-apply init)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id")
);

-- ── Indexes ────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "AuPairProfile_userId_key" ON "AuPairProfile"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "FamilyProfile_userId_key" ON "FamilyProfile"("userId");
CREATE INDEX IF NOT EXISTS "Verification_userId_idx" ON "Verification"("userId");
CREATE INDEX IF NOT EXISTS "Conversation_userAId_idx" ON "Conversation"("userAId");
CREATE INDEX IF NOT EXISTS "Conversation_userBId_idx" ON "Conversation"("userBId");
CREATE UNIQUE INDEX IF NOT EXISTS "Conversation_userAId_userBId_key" ON "Conversation"("userAId", "userBId");
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");
CREATE UNIQUE INDEX IF NOT EXISTS "Favorite_userId_targetType_targetId_key" ON "Favorite"("userId", "targetType", "targetId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_authorId_targetId_key" ON "Review"("authorId", "targetId");
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status");

-- ── Foreign keys (skip if already present) ─────────────────────────
DO $$ BEGIN
  ALTER TABLE "AuPairProfile" ADD CONSTRAINT "AuPairProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "FamilyProfile" ADD CONSTRAINT "FamilyProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userAId_fkey"
    FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userBId_fkey"
    FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey"
    FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Mark init migration applied (checksum matches repo migration file)
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
SELECT
  gen_random_uuid()::text,
  'manual-supabase-init-safe',
  now(),
  '20260806094718_init_postgres',
  NULL,
  NULL,
  now(),
  1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = '20260806094718_init_postgres'
);

-- Done. Check Table Editor for: User, AuPairProfile, FamilyProfile, Message, etc.
