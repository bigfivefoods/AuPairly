# Deploy AuPairly (Postgres + Vercel + aupairly.me)

## 1. Database (Prisma Postgres)

A free **Prisma Postgres** instance was provisioned for this project.

**Important:** temporary DBs auto-delete unless claimed. Open the claim URL and attach it to your Prisma Data Platform account for a permanent database:

👉 **Claim permanent database:**  
https://create-db.prisma.io/claim?projectID=proj_xn4un7x3sl8rsocpibmmskvg&utm_source=create-db&utm_medium=cli

After claiming, copy the production `DATABASE_URL` from the Prisma dashboard and set it in Vercel (and local `.env`).

### Alternatives

- [Neon](https://neon.tech) free Postgres  
- [Supabase](https://supabase.com)  
- Vercel Marketplace → Neon / Prisma Postgres  

```bash
# Local
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
npm run db:seed
```

## 2. Vercel project

```bash
npx vercel login
npx vercel link   # project name: aupairly
```

Set environment variables (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://www.aupairly.me` (or your `*.vercel.app` URL until domain is live) |
| `NEXT_PUBLIC_SITE_URL` | same as `AUTH_URL` |
| `NEXT_PUBLIC_SITE_NAME` | `AuPairly` |
| `AUTO_VERIFY` | `true` (demo) or `false` (admin queue) |

```bash
npx vercel env add DATABASE_URL production
# …repeat for each var

npx vercel --prod
npm run db:seed   # against production DATABASE_URL once
```

Build runs: `prisma generate && prisma migrate deploy && next build`.

## 3. Custom domain www.aupairly.me

In **Vercel → Project → Settings → Domains**:

1. Add `aupairly.me` and `www.aupairly.me`
2. Prefer apex → www redirect (or reverse)
3. At your DNS host, point:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `76.76.21.21` (Vercel) |
| CNAME | `www` | `cname.vercel-dns.com` |

Or use the exact records Vercel shows for your project.

Then set:

```
AUTH_URL=https://www.aupairly.me
NEXT_PUBLIC_SITE_URL=https://www.aupairly.me
```

Redeploy production.

## 4. Post-deploy checklist

- [ ] Claim Prisma Postgres (link above)  
- [ ] Open `https://www.aupairly.me` (or Vercel URL)  
- [ ] Log in: `parent@demo.aupairly.me` / `demo1234`  
- [ ] Upload a profile photo  
- [ ] Set `AUTO_VERIFY=false` when ready for real admin review  
- [ ] Optional: Resend for password-reset emails  

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.aupairly.me | demo1234 |
| Parent | parent@demo.aupairly.me | demo1234 |
| Au pair | aupair@demo.aupairly.me | demo1234 |
