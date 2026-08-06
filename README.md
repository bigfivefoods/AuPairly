# AuPairly

**The trusted marketplace for verified au pairs and host families** — built for [www.aupairly.me](https://www.aupairly.me).

AuPairly is an Airbnb-style platform where:

- **Au pairs** register, build rich profiles, complete identity verification, and get discovered by families
- **Parents** list their household, set expectations and pay, verify themselves, and message candidates
- Both sides **browse, filter, message, review, and match** in one beautiful end-to-end product

## Features

| Area | What you get |
|------|----------------|
| **Auth** | Email/password signup as au pair or parent; forgot/reset password |
| **Profiles** | Full listing editor + **profile photo uploads** |
| **Verification** | ID / selfie / docs with upload; auto-approve (demo) or **admin queue** |
| **Marketplace** | Search & filter au pairs and families; public detail pages |
| **Messaging** | In-app conversations between parents and au pairs |
| **Reviews** | Rate members you've messaged; ratings update public scores |
| **Safety** | Report profiles; admin sees open reports |
| **Admin** | `/admin` — approve/reject verifications, view reports |
| **Hardening** | Rate limits on auth/upload/register; Resend-ready email |

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4
- **Prisma 7** + **Supabase Postgres** (preferred)
- **Auth.js (next-auth v5)** credentials provider
- **bcryptjs**, **Zod**, optional **Resend** for email

## Quick start (Supabase)

1. Create a free project at [supabase.com](https://supabase.com/dashboard)  
2. Copy **Transaction** + **Direct** connection strings (see [SUPABASE.md](./SUPABASE.md))

```bash
npm install
cp .env.example .env
# paste DATABASE_URL (pooler :6543) and DIRECT_URL (:5432) into .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.aupairly.me` | `demo1234` |
| Parent | `parent@demo.aupairly.me` | `demo1234` |
| Au pair | `aupair@demo.aupairly.me` | `demo1234` |

Demo parent ↔ au pair already have messages and mutual reviews.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run db:seed` | Seed demo users & listings |
| `npm run db:migrate` | Run migrations |
| `npm run db:reset` | Reset DB + re-seed |

## Product map

```
/                     Landing
/register             Join as parent or au pair
/login                Sign in
/forgot-password      Request reset link
/reset-password       Set new password
/dashboard            Account hub + checklist
/profile/edit         Edit listing + upload photo
/verification         ID / selfie / document checks
/browse/aupairs       Marketplace — au pairs (+ reviews)
/browse/families      Marketplace — families (+ reviews)
/messages             Inbox + thread chat
/admin                Admin verification & reports
/how-it-works         Guide
/safety               Trust & safety
```

## Environment variables

See `.env.example`:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase **Transaction** pooler URL (port **6543**) |
| `DIRECT_URL` | Supabase **Direct/Session** URL (port **5432**, for migrations) |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` | Site origin |
| `AUTO_VERIFY` | `true` (demo auto-approve) or `false` (admin queue) |
| `RESEND_API_KEY` | Optional real email for password reset |
| `EMAIL_FROM` | From address when using Resend |

## Deploy to Vercel → aupairly.me

**Database:** [SUPABASE.md](./SUPABASE.md) · **Deploy:** [DEPLOY.md](./DEPLOY.md)

Quick links:

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/bigfivefoods/AuPairly |
| Vercel project | https://vercel.com/bigfivefoods-projects/aupairly |
| Supabase dashboard | https://supabase.com/dashboard |
| One-click import | https://vercel.com/new/clone?repository-url=https://github.com/bigfivefoods/AuPairly&project-name=aupairly |

Stack uses **Supabase PostgreSQL** via Prisma (`@prisma/adapter-pg`). Build runs migrations automatically.

### Photo storage note

Uploads go to `public/uploads/{userId}/` on disk. On Vercel’s ephemeral filesystem, the code falls back to data URLs for small images. For production scale, plug in **Vercel Blob** or S3 in `src/lib/uploads.ts`.

## Production checklist

- [x] Profile photo uploads  
- [x] Password forgot / reset  
- [x] Reviews after messaging  
- [x] Admin verification queue (`AUTO_VERIFY=false`)  
- [x] Abuse reports  
- [x] Rate limiting  
- [x] PostgreSQL + Prisma adapter  
- [x] Vercel project created (`aupairly`)  
- [x] GitHub repo + deploy docs  
- [ ] Create Supabase project + set `DATABASE_URL` / `DIRECT_URL`  
- [ ] `prisma migrate deploy` + `db:seed`  
- [ ] Connect GitHub → Vercel + set env + redeploy  
- [ ] Attach www.aupairly.me (register or point DNS)  
- [ ] Real KYC / Resend emails (optional next)  

## License

Private — AuPairly / aupairly.me
