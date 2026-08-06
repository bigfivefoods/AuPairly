# Supabase setup for AuPairly

You do **not** need Prisma Postgres if you prefer Supabase.  
Supabase is regular **PostgreSQL** — this app already uses Prisma + Postgres.

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → name it e.g. `aupairly`
3. Set a strong **database password** (save it)
4. Choose a region close to your users
5. Wait until the project is ready

## 2. Copy connection strings

**Project Settings → Database → Connection string**

| Env var | Supabase mode | Port | Used for |
|---------|---------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | `6543` | App / Vercel (serverless) |
| `DIRECT_URL` | **Session** pooler or **Direct** | `5432` | `prisma migrate` |

Example shape (yours will differ):

```env
DATABASE_URL="postgresql://postgres.abcdefgh:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefgh:YOUR_PASSWORD@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"
```

If the password has `@`, `#`, `/`, etc., [URL-encode](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding) it.

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
