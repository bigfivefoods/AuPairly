-- Extra profile fields
ALTER TABLE "AuPairProfile" ADD COLUMN IF NOT EXISTS "careFocus" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "FamilyProfile" ADD COLUMN IF NOT EXISTS "careFocus" TEXT NOT NULL DEFAULT '[]';

-- Helpful indexes for category filtering (text contains)
CREATE INDEX IF NOT EXISTS "AuPairProfile_services_idx" ON "AuPairProfile"("services");
CREATE INDEX IF NOT EXISTS "AuPairProfile_status_services_idx" ON "AuPairProfile"("status", "services");
CREATE INDEX IF NOT EXISTS "FamilyProfile_services_idx" ON "FamilyProfile"("services");
CREATE INDEX IF NOT EXISTS "FamilyProfile_status_services_idx" ON "FamilyProfile"("status", "services");

-- Service catalog
CREATE TABLE IF NOT EXISTS "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "examples" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- Normalized tags for filtering
CREATE TABLE IF NOT EXISTS "ProfileServiceTag" (
    "id" TEXT NOT NULL,
    "profileRole" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileServiceTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProfileServiceTag_profileRole_profileId_serviceId_key"
  ON "ProfileServiceTag"("profileRole", "profileId", "serviceId");
CREATE INDEX IF NOT EXISTS "ProfileServiceTag_serviceId_idx" ON "ProfileServiceTag"("serviceId");
CREATE INDEX IF NOT EXISTS "ProfileServiceTag_profileId_idx" ON "ProfileServiceTag"("profileId");
CREATE INDEX IF NOT EXISTS "ProfileServiceTag_profileRole_serviceId_idx"
  ON "ProfileServiceTag"("profileRole", "serviceId");

DO $$ BEGIN
  ALTER TABLE "ProfileServiceTag" ADD CONSTRAINT "ProfileServiceTag_serviceId_fkey"
    FOREIGN KEY ("serviceId") REFERENCES "ServiceCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed catalog rows (upsert)
INSERT INTO "ServiceCategory" ("id", "name", "shortName", "slug", "description", "examples", "sortOrder", "active", "createdAt", "updatedAt")
VALUES
  ('CHILDCARE', 'Childcare', 'Childcare', 'childcare',
   'Trusted care for children — au pairs, babysitting, after-school, special needs, overnight, and more.',
   '["Au pairs","Babysitting","Online care","After-school","Special needs","Overnight care"]',
   1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('CAREGIVING', 'Caregiving', 'Caregiving', 'caregiving',
   'Compassionate support for adults — elderly care, companionship, disability support, personal care, and respite.',
   '["Elderly care","Companionship","Disability support","Personal care","Respite care"]',
   2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('HOUSE_SITTING', 'House Sitting', 'House sitting', 'house-sitting',
   'Short-term or long-term house sitting, holiday stays, property checks, and plant care.',
   '["Short-term sitting","Long-term sitting","Holiday house sitting","Property checks","Plant care"]',
   3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('PET_SITTING', 'Pet Sitting', 'Pet sitting', 'pet-sitting',
   'Dog sitting and walking, cat sitting, overnight pet care, multi-pet homes, and drop-in visits.',
   '["Dog sitting","Dog walking","Cat sitting","Overnight pet care","Multi-pet","Drop-in visits"]',
   4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "shortName" = EXCLUDED."shortName",
  "slug" = EXCLUDED."slug",
  "description" = EXCLUDED."description",
  "examples" = EXCLUDED."examples",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = EXCLUDED."active",
  "updatedAt" = CURRENT_TIMESTAMP;

-- Backfill tags from existing profile.services JSON for sitters
INSERT INTO "ProfileServiceTag" ("id", "profileRole", "profileId", "serviceId", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || p.id || s.service_id)::text,
  'AUPAIR',
  p.id,
  s.service_id,
  CURRENT_TIMESTAMP
FROM "AuPairProfile" p
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(
    CASE
      WHEN p.services IS NULL OR btrim(p.services) = '' THEN '["CHILDCARE"]'::jsonb
      WHEN p.services::text LIKE '[%' THEN p.services::jsonb
      ELSE '["CHILDCARE"]'::jsonb
    END
  ) AS service_id
) s
WHERE s.service_id IN ('CHILDCARE','CAREGIVING','HOUSE_SITTING','PET_SITTING')
ON CONFLICT ("profileRole", "profileId", "serviceId") DO NOTHING;

-- Backfill tags for hosts
INSERT INTO "ProfileServiceTag" ("id", "profileRole", "profileId", "serviceId", "createdAt")
SELECT
  md5(random()::text || clock_timestamp()::text || p.id || s.service_id)::text,
  'FAMILY',
  p.id,
  s.service_id,
  CURRENT_TIMESTAMP
FROM "FamilyProfile" p
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(
    CASE
      WHEN p.services IS NULL OR btrim(p.services) = '' THEN '["CHILDCARE"]'::jsonb
      WHEN p.services::text LIKE '[%' THEN p.services::jsonb
      ELSE '["CHILDCARE"]'::jsonb
    END
  ) AS service_id
) s
WHERE s.service_id IN ('CHILDCARE','CAREGIVING','HOUSE_SITTING','PET_SITTING')
ON CONFLICT ("profileRole", "profileId", "serviceId") DO NOTHING;
