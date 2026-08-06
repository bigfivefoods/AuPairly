# Deploy AuPairly (Postgres + Vercel + aupairly.me)

## Status

| Piece | Status |
|-------|--------|
| App code | ✅ GitHub: https://github.com/bigfivefoods/AuPairly |
| Database | ✅ Prisma Postgres (claim to keep permanent) |
| Vercel project | ✅ Created: **aupairly** (`prj_Xkd1WRxncxzJRvTp6FrY7s4l2VcG`) |
| Production URL | https://aupairly-bigfivefoods-projects.vercel.app |
| Full app on Vercel | ⚠️ Connect GitHub + set env (steps below) |
| Domain www.aupairly.me | ⚠️ Add in Vercel Domains |

---

## 1. Claim permanent Postgres (do this first)

Temporary DBs auto-delete. **Claim now:**

👉 https://create-db.prisma.io/claim?projectID=proj_xn4un7x3sl8rsocpibmmskvg&utm_source=create-db&utm_medium=cli

Copy the production `DATABASE_URL` from the Prisma dashboard after claiming.

---

## 2. Finish Vercel setup (5 minutes)

### A. Import GitHub repo into the existing project

1. Open https://vercel.com/bigfivefoods-projects/aupairly/settings/git  
2. Connect repository: **bigfivefoods/AuPairly** (branch `main`)  
3. Or one-click re-import:  
   https://vercel.com/new/clone?repository-url=https://github.com/bigfivefoods/AuPairly&project-name=aupairly&repository-name=AuPairly

### B. Environment variables

**Project → Settings → Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Postgres URL from step 1 |
| `AUTH_SECRET` | run: `openssl rand -base64 32` |
| `AUTH_URL` | `https://aupairly-bigfivefoods-projects.vercel.app` (update after custom domain) |
| `NEXT_PUBLIC_SITE_URL` | same as `AUTH_URL` |
| `NEXT_PUBLIC_SITE_NAME` | `AuPairly` |
| `AUTO_VERIFY` | `true` for demo / `false` for admin queue |

### C. Redeploy

**Deployments → Redeploy** latest, or push to `main`.

Build command (already in `vercel.json`):

```
prisma generate && prisma migrate deploy && next build
```

### D. Seed production data

```bash
export DATABASE_URL="postgresql://..."   # production URL
npm run db:seed
```

Demo logins: `parent@demo.aupairly.me` / `demo1234` (also admin & aupair).

---

## 3. Domain www.aupairly.me

1. Vercel → Project **aupairly** → **Settings → Domains**  
2. Add `aupairly.me` and `www.aupairly.me`  
3. DNS at your registrar:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

(Use the exact records Vercel shows if different.)

4. Update env:

```
AUTH_URL=https://www.aupairly.me
NEXT_PUBLIC_SITE_URL=https://www.aupairly.me
```

5. Redeploy production.

---

## 4. CLI alternative (with token)

```bash
# https://vercel.com/account/tokens
export VERCEL_TOKEN=...
export VERCEL_SCOPE=bigfivefoods-projects
./scripts/vercel-deploy.sh
```

---

## Local development (Postgres)

```bash
cp .env.example .env
# set DATABASE_URL to your Postgres URL
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Stack is **PostgreSQL only** (Prisma 7 + `@prisma/adapter-pg`).
