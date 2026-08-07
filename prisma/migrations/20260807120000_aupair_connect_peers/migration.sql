-- AuPair Connect: peer community among sitters

CREATE TYPE "PeerConnectStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

ALTER TABLE "AuPairProfile"
  ADD COLUMN IF NOT EXISTS "openToPeerConnect" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "peerIntro" TEXT;

CREATE TABLE IF NOT EXISTS "PeerConnect" (
  "id" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "message" TEXT,
  "status" "PeerConnectStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PeerConnect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PeerConnect_fromUserId_toUserId_key"
  ON "PeerConnect"("fromUserId", "toUserId");

CREATE INDEX IF NOT EXISTS "PeerConnect_toUserId_status_idx"
  ON "PeerConnect"("toUserId", "status");

CREATE INDEX IF NOT EXISTS "PeerConnect_fromUserId_status_idx"
  ON "PeerConnect"("fromUserId", "status");

CREATE INDEX IF NOT EXISTS "AuPairProfile_openToPeerConnect_status_city_idx"
  ON "AuPairProfile"("openToPeerConnect", "status", "city");

ALTER TABLE "PeerConnect"
  ADD CONSTRAINT "PeerConnect_fromUserId_fkey"
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PeerConnect"
  ADD CONSTRAINT "PeerConnect_toUserId_fkey"
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
