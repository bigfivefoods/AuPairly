-- AlterTable: KYC provider fields + Facebook profile import
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "facebookId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "facebookProfile" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "idNumberLast4" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycExternalId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycCountry" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_facebookId_key" ON "User"("facebookId");
