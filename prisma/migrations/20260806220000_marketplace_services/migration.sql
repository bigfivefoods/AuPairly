-- Multi-service marketplace: childcare, house sitting, pet sitting
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "services" TEXT NOT NULL DEFAULT '["CHILDCARE"]';
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "petTypes" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "houseSittingNotes" TEXT;

ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "services" TEXT NOT NULL DEFAULT '["CHILDCARE"]';
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "petTypes" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "houseSittingNotes" TEXT;
