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
- **Prisma 7** + SQLite (local) — use Postgres on Vercel
- **Auth.js (next-auth v5)** credentials provider
- **bcryptjs**, **Zod**, optional **Resend** for email

## Quick start

```bash
npm install
cp .env.example .env   # if needed
npx prisma migrate dev
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
| `DATABASE_URL` | SQLite `file:./dev.db` or Postgres URL |
| `AUTH_SECRET` | Auth.js secret (`openssl rand -base64 32`) |
| `AUTH_URL` / `NEXT_PUBLIC_SITE_URL` | Site origin |
| `AUTO_VERIFY` | `true` (demo auto-approve) or `false` (admin queue) |
| `RESEND_API_KEY` | Optional real email for password reset |
| `EMAIL_FROM` | From address when using Resend |

## Deploy to Vercel → aupairly.me

1. Import the repo into Vercel (or use CLI: `npx vercel`).
2. `vercel.json` already sets framework + `prisma generate && next build`.
3. **Production database:** use Postgres (Neon, Supabase, or Vercel Postgres).  
   - Change `provider` in `prisma/schema.prisma` to `postgresql`  
   - Install `@prisma/adapter-pg` + `pg` and update `src/lib/prisma.ts`  
   - Set `DATABASE_URL` in Vercel project settings  
   - Run migrations against prod: `npx prisma migrate deploy`
4. Set env vars: `AUTH_SECRET`, `AUTH_URL=https://www.aupairly.me`, `NEXT_PUBLIC_SITE_URL`, `AUTO_VERIFY=false`.
5. Attach domain **www.aupairly.me** in Vercel → Domains.
6. Optional: `RESEND_API_KEY` for password-reset emails.

> SQLite + `better-sqlite3` is for local demos. Serverless hosts need Postgres (or a persistent disk).

### Photo storage note

Uploads go to `public/uploads/{userId}/` on disk. On Vercel’s ephemeral filesystem, the code falls back to data URLs for small images. For production scale, plug in **Vercel Blob** or S3 in `src/lib/uploads.ts`.

## Production checklist

- [x] Profile photo uploads  
- [x] Password forgot / reset  
- [x] Reviews after messaging  
- [x] Admin verification queue (`AUTO_VERIFY=false`)  
- [x] Abuse reports  
- [x] Rate limiting (register, upload, password, reviews)  
- [x] Vercel config  
- [ ] Postgres + Blob storage on production  
- [ ] Real KYC (Persona / Stripe Identity)  
- [ ] Email magic links  

## License

Private — AuPairly / aupairly.me
