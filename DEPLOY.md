# Deploy AuPairly (Supabase + Vercel + aupairly.me)

> **Database = Supabase Postgres only.**  
> Do **not** use Prisma Postgres, Neon, or SQLite for this project.  
> Full Supabase guide: [SUPABASE.md](./SUPABASE.md)

## Your Supabase project

| | |
|--|--|
| Dashboard | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks |
| Database settings | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database |
| API URL | `https://bpbxjzgzyfbpkujrfzks.supabase.co` |
| Project ref | `bpbxjzgzyfbpkujrfzks` |

## Status

| Piece | Status |
|-------|--------|
| App code | ✅ GitHub: https://github.com/bigfivefoods/AuPairly |
| Database host | ✅ **Supabase** (project above) |
| Vercel project | ✅ **aupairly** — https://vercel.com/bigfivefoods-projects/aupairly |
| Env on Vercel | ⚠️ Must set Supabase `DATABASE_URL` + `DIRECT_URL` (build fails without them) |
| Domain www.aupairly.me | ⚠️ Add in Vercel Domains |

---

## 1. Supabase connection strings

Open [Database settings](https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks/settings/database) → **Connection string** → **URI**.

| Env var | Supabase mode | Port | Used for |
|---------|---------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | **6543** | App runtime (+ `?pgbouncer=true`) |
| `DIRECT_URL` | **Session** or **Direct** | **5432** | `prisma migrate deploy` on Vercel |

Also set API keys (Settings → API):

| Env var | Value |
|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bpbxjzgzyfbpkujrfzks.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from Supabase API settings |

---

## 2. Vercel environment variables

https://vercel.com/bigfivefoods-projects/aupairly/settings/environment-variables  

Add for **Production** and **Preview** (available at **Build** time):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Supabase Transaction URI (6543) |
| `DIRECT_URL` | Supabase Session/Direct URI (5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bpbxjzgzyfbpkujrfzks.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | your publishable key |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://aupairly-bigfivefoods-projects.vercel.app` (then custom domain) |
| `NEXT_PUBLIC_SITE_URL` | same as `AUTH_URL` |
| `NEXT_PUBLIC_SITE_NAME` | `AuPairly` |
| `AUTO_VERIFY` | `true` for demo |

Then **Redeploy**.

Build uses `scripts/vercel-build.sh` → `prisma generate` → `migrate deploy` → `next build`.

### Seed production (once after first successful deploy)

```bash
export DIRECT_URL="postgresql://..."   # Supabase :5432
export DATABASE_URL="postgresql://..." # Supabase :6543
npm run db:seed
```

Demo logins: `parent@demo.aupairly.me` / `demo1234` (also admin & aupair).

---

## 3. Domain www.aupairly.me

1. Vercel → **aupairly** → Settings → Domains  
2. Add `aupairly.me` and `www.aupairly.me`  
3. Point DNS as Vercel shows  
4. Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://www.aupairly.me`  
5. Redeploy  

---

## Local development (Supabase)

```bash
cp .env.example .env
# paste DATABASE_URL + DIRECT_URL from Supabase + public API keys
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Stack: **Next.js + Prisma 7 + Supabase Postgres** (`@prisma/adapter-pg`).
