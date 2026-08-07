-- =============================================================================
-- AuPairly — Supabase Row Level Security (RLS)
-- =============================================================================
-- Architecture:
--   • App data access = Prisma via DATABASE_URL (Postgres role / pooler).
--     Table owner / superuser paths used by Prisma still work with RLS ON
--     (we do NOT use FORCE ROW LEVEL SECURITY).
--   • Auth = Auth.js credentials (not Supabase Auth).
--   • Browser publishable key must NOT be able to SELECT/INSERT app tables.
--
-- Run in Supabase SQL Editor, or via: npx prisma migrate deploy
-- (migration mirrors this file).
-- =============================================================================

-- ── 1. App tables (Prisma public schema) ─────────────────────────────────────
DO $$
DECLARE
  t text;
  pol record;
  tables text[] := ARRAY[
    'User',
    'AuPairProfile',
    'FamilyProfile',
    'UserBlock',
    'CityHangout',
    'ServiceCategory',
    'ProfileServiceTag',
    'Verification',
    'Conversation',
    'Message',
    'Favorite',
    'Review',
    'PasswordResetToken',
    'Report',
    'Interest',
    'PeerConnect',
    'Notification',
    'Subscription',
    'Swipe',
    'UsageCounter',
    'MarketplaceProduct',
    'Placement',
    'ReferenceRequest',
    'SecureDocument',
    'Story',
    'Agency',
    'SupportTicket',
    'SavedSearch',
    'AvailabilitySlot',
    'ShortlistItem',
    'ApplicationPacket',
    'InterviewProposal',
    'PlacementCheckIn',
    'BoostEvent',
    'PaymentTransaction',
    'CityWaitlist',
    'PushSubscription'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relname = t
        AND c.relkind = 'r'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      -- Explicitly do NOT force RLS for table owner (Prisma migration role)
      EXECUTE format('ALTER TABLE public.%I NO FORCE ROW LEVEL SECURITY', t);

      -- Drop ALL existing policies so no leftover public/authenticated grants remain
      FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format(
          'DROP POLICY IF EXISTS %I ON public.%I',
          pol.policyname,
          t
        );
      END LOOP;

      -- Revoke API roles — defense in depth (RLS alone also denies with zero policies)
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
      -- Keep service_role for Supabase dashboard / edge if used
      BEGIN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', t);
      EXCEPTION WHEN undefined_object THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Default privileges: new tables should not grant anon/authenticated
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ── 2. Deny-all explicit policies (optional clarity for auditors) ────────────
-- With RLS enabled and no policies, access is denied for non-owner roles.
-- We add named DENY-style policies only where useful — Postgres RLS is
-- "allow if any policy matches"; zero policies = deny for non-bypass roles.

-- ── 3. Storage bucket policies (aupairly) ────────────────────────────────────
-- Uploads use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
-- Public avatar/gallery URLs need SELECT for anon.

INSERT INTO storage.buckets (id, name, public)
VALUES ('aupairly', 'aupairly', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Clean old policies on this bucket (names we own)
DROP POLICY IF EXISTS "aupairly_public_read" ON storage.objects;
DROP POLICY IF EXISTS "aupairly_service_insert" ON storage.objects;
DROP POLICY IF EXISTS "aupairly_service_update" ON storage.objects;
DROP POLICY IF EXISTS "aupairly_service_delete" ON storage.objects;
DROP POLICY IF EXISTS "Public read aupairly" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aupairly" ON storage.objects;

-- Anyone can read public media (profile photos)
CREATE POLICY "aupairly_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'aupairly');

-- No INSERT/UPDATE/DELETE policies for anon/authenticated → blocked
-- Service role bypasses RLS and continues to upload from Next.js server.

-- ── 4. Verification helpers (run after apply) ────────────────────────────────
-- SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r'
-- ORDER BY 1;
