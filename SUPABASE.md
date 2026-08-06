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
- `AUTO_VERIFY=true`

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

## Optional later

- Supabase Storage for profile photos (today uploads use local/data-URL fallback)
- Supabase Auth (today we use Auth.js email/password)

Not required for the marketplace to run.
