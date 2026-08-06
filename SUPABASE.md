# Supabase setup for AuPairly

## Your project

| | |
|--|--|
| **Dashboard** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks |
| **Project ref** | `bpbxjzgzyfbpkujrfzks` |
| **Database settings** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database |
| **Table editor** | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/editor |

You do **not** need Prisma Postgres. Supabase is regular **PostgreSQL**.

## 1. Get connection strings (required)

Open **[Database settings](https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database)** → **Connection string**.

| Env var | Mode in UI | Port | Used for |
|---------|------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | `6543` | App / Vercel |
| `DIRECT_URL` | **Session** pooler or **Direct** | `5432` | `prisma migrate` |

Click **URI**, paste your database password when prompted, copy both.

Template with your project ref (region host may differ — use what Supabase shows):

```env
DATABASE_URL="postgresql://postgres.bpbxjzgzyfbpkujrfzks:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.bpbxjzgzyfbpkujrfzks:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
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
npx prisma migrate deploy    # creates tables on Supabase
npm run db:seed              # demo accounts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Role | Email | Password |
|------|-------|----------|
| Parent | `parent@demo.aupairly.me` | `demo1234` |
| Au pair | `aupair@demo.aupairly.me` | `demo1234` |
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

## Optional later

- Supabase Storage for profile photos (today uploads use local/data-URL fallback)
- Supabase Auth (today we use Auth.js email/password)

Not required for the marketplace to run.
