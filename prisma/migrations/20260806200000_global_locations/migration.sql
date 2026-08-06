-- Au pair location hierarchy
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "continent" TEXT;
CREATE INDEX IF NOT EXISTS "AuPairProfile_continent_idx" ON "AuPairProfile"("continent");
CREATE INDEX IF NOT EXISTS "AuPairProfile_country_idx" ON "AuPairProfile"("country");
CREATE INDEX IF NOT EXISTS "AuPairProfile_region_idx" ON "AuPairProfile"("region");
CREATE INDEX IF NOT EXISTS "AuPairProfile_city_idx" ON "AuPairProfile"("city");

-- Family location hierarchy
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "region" TEXT;
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "continent" TEXT;
CREATE INDEX IF NOT EXISTS "FamilyProfile_continent_idx" ON "FamilyProfile"("continent");
CREATE INDEX IF NOT EXISTS "FamilyProfile_country_idx" ON "FamilyProfile"("country");
CREATE INDEX IF NOT EXISTS "FamilyProfile_region_idx" ON "FamilyProfile"("region");
CREATE INDEX IF NOT EXISTS "FamilyProfile_city_idx" ON "FamilyProfile"("city");
