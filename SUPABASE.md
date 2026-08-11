# Supabase setup for AuPairly

**This project’s only database is Supabase Postgres.**  
Do not use SQLite, Neon, Prisma Postgres, Vercel Postgres, or `POSTGRES_*` env aliases.

## Your project

| | |
|--|--|
| **Dashboard** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks |
| **Project ref** | `bpbxjzgzyfbpkujrfzks` |
| **Database settings** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database |
| **Table editor** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/editor |

Prisma talks to Supabase over the standard Postgres connection strings below.
## 1. Get connection strings (required)

Open **[Database settings](https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database)** → **Connection string**.

| Env var | Mode in UI | Port | Used for |
|---------|------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | `6543` | App / Vercel |
| `DIRECT_URL` | **Session** pooler or **Direct** | `5432` | `prisma migrate` |

Click **URI**, paste your database password when prompted, copy both.

Template with your project ref (region host may differ — use what Supabase shows):

```env
DATABASE_URL="postgresql://postgres.bpbxjzgzyfbpkujrfzks:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bpbxjzgzyfbpkujrfzks:YOUR_PASSWORD@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
```

If the password has `@`, `#`, `/`, etc., [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) it.

**Forgot password?** Database settings → **Reset database password**.

## 3. Local `.env`

```bash
cp .env.example .env
# paste DATABASE_URL and DIRECT_URL into .env
```

## 4. Migrate + seed

```bash
npm install
npx prisma migrate deploy    # creates / updates all tables on Supabase
npm run db:seed              # demo accounts for all 4 categories
npm run dev
```

### Marketplace categories (DB)

| `ServiceCategory.id` | Landing page | Profile fields |
|----------------------|--------------|----------------|
| `CHILDCARE` | `/childcare` | `services` JSON + `ProfileServiceTag` |
| `CAREGIVING` | `/caregiving` | same |
| `HOUSE_SITTING` | `/house-sitting` | + `houseSittingNotes` |
| `PET_SITTING` | `/pet-sitting` | + `petTypes` |

Related tables: `ServiceCategory`, `ProfileServiceTag`, plus `services` / `petTypes` / `careFocus` / `houseSittingNotes` on `AuPairProfile` and `FamilyProfile`.

**Manual SQL (optional):** run `supabase-marketplace-categories.sql` in the Supabase SQL Editor if you cannot run Prisma migrate.

Open [http://localhost:3000](http://localhost:3000).

| Role | Email | Password |
|------|-------|----------|
| Host | `parent@demo.aupairly.me` | `demo1234` |
| Sitter (multi-service) | `aupair@demo.aupairly.me` | `demo1234` |
| Caregiver | `grace@demo.aupairly.me` | `demo1234` |
| House sitter | `daniel@demo.aupairly.me` | `demo1234` |
| Pet sitter | `mia@demo.aupairly.me` | `demo1234` |
| Admin | `admin@demo.aupairly.me` | `demo1234` |

## 5. Vercel env vars

In **Vercel → aupairly → Settings → Environment Variables**, add the same:

- `DATABASE_URL` (pooler / 6543)
- `DIRECT_URL` (5432)
- `AUTH_SECRET`
- `AUTH_URL` / `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SITE_NAME=AuPairly`
- `AUTO_VERIFY=false` (production); set `true` only for local demos

Then redeploy.

## 6. Verify in Supabase

**Table Editor** should show tables like `User`, `AuPairProfile`, `FamilyProfile`, `Message`, etc. after migrate + seed.

## API keys (public)

Project **API** settings (not the same as Database URL):

```env
NEXT_PUBLIC_SUPABASE_URL=https://bpbxjzgzyfbpkujrfzks.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

These power `@supabase/supabase-js` helpers in `src/lib/supabase/`.  
They **cannot** replace `DATABASE_URL` / `DIRECT_URL` for Prisma tables.

## 7. Row Level Security (RLS) — required for production

Auth is **Auth.js**, not Supabase Auth. App data is read/written only through **Prisma** (`DATABASE_URL`).  
The browser **publishable key** must never be able to query business tables via PostgREST.

### What we enforce

| Layer | Behaviour |
|-------|-----------|
| **RLS ON** all Prisma tables | `anon` / `authenticated` get **no** policies → denied |
| **No FORCE RLS** | Prisma’s DB role (table owner) still works |
| **REVOKE** from `anon` / `authenticated` | Extra hard deny on table privileges |
| **Storage bucket `aupairly`** | Public **SELECT** (profile photos); uploads only via **service role** |

SQL source of truth:

- `supabase/rls-enforce.sql`
- Prisma migration `prisma/migrations/20260807180000_rls_enforce/`

### Apply

```bash
# Preferred (Vercel build already runs migrate deploy)
npx prisma migrate deploy

# Or paste into Supabase → SQL Editor → Run
# File: supabase/rls-enforce.sql
```

### Verify in SQL Editor

```sql
-- All app tables should show rowsecurity = true
SELECT c.relname AS table, c.relrowsecurity AS rls_on, c.relforcerowsecurity AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY 1;

-- Should return 0 rows for public policies on app tables
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';
```

### Threat model (honest)

| Path | Protected? |
|------|------------|
| Someone uses your **publishable key** + Supabase REST/Realtime on `User` / messages | **Yes** — RLS + revoke |
| Someone steals **DATABASE_URL** or **service_role** | **No** — treat as root secrets |
| Prisma app server | **Intended** — full access after Auth.js checks in code |

Never put `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL` in client bundles.

## Optional later

- Supabase Auth (today we use Auth.js email/password)
- Per-user storage paths tied to Supabase Auth UIDs (only if you migrate auth)

Not required for the marketplace to run once RLS is applied.
