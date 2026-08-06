# AuPairly

**Trusted care for your family, home & pets.** — [www.aupairly.me](https://www.aupairly.me)

Same brand name, broader positioning: one marketplace for **childcare / au pairing**, **house sitting**, and **pet sitting**.

- **Sitters** offer one or more services, verify, and get discovered
- **Hosts** list what they need (family care, home, pets), verify, and message candidates
- Both sides **swipe, match, message, review**, and **upgrade** when free-tier limits run out

## Commercial model (freemium)

| Plan | Parents | Au pairs | Limits |
|------|---------|----------|--------|
| **Starter (Free)** | $0 | $0 | 5 messages/day, 3 interests/week, 20 Discover swipes/day |
| **Plus** | R69/mo | R69/mo | Unlimited matching, see who liked you, featured badge, 1 boost/mo |
| **Premium** | R169/mo | R169/mo | Everything in Plus + priority search, 4 boosts/mo |

Without Stripe keys, upgrades run in **demo mode** (30 days free) so you can pitch today.

## Features

| Area | What you get |
|------|----------------|
| **Auth** | Email/password signup as au pair or parent; forgot/reset password |
| **Profiles** | Full listing editor + **profile photo uploads** |
| **Verification** | ID / selfie / docs with upload; auto-approve (demo) or **admin queue** |
| **Discover** | Swipe cards; mutual likes open chat + match notifications |
| **Pricing / Billing** | `/pricing` plans + `/billing` membership; Stripe Checkout or demo |
| **Marketplace** | Search & filter au pairs and families; public detail pages |
| **Messaging** | In-app conversations with free-tier paywalls |
| **Interests** | Express interest / apply with weekly free-tier limits |
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
/discover             Swipe-to-match
/pricing              Plans & upgrade
/billing              Current membership
/interests            Interests sent/received
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

## Stripe Connect sample

Seller marketplace payments (V2 Accounts + direct charges + platform fee).

| Path | Purpose |
|------|---------|
| `/connect` | Seller dashboard: create account, onboard, products, seller subscription |
| `/store/[accountId]` | Public storefront (demo uses raw `acct_` — use a slug in production) |
| `/api/connect/account` | Create / status of connected account |
| `/api/connect/onboard` | V2 Account Links |
| `/api/connect/products` | Create & list products on connected account |
| `/api/connect/checkout` | Hosted Checkout (direct charge + application fee) |
| `/api/connect/subscribe` | Platform subscription + billing portal |
| `/api/connect/webhook` | Thin V2 events + classic billing webhooks |

### Local webhooks

```bash
# Thin events (Connect V2 requirements / capabilities)
stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated,v2.core.account[configuration.customer].capability_status_updated' --forward-thin-to localhost:3000/api/connect/webhook

# Classic billing events
stripe listen --events checkout.session.completed,customer.subscription.updated,customer.subscription.deleted,invoice.paid,invoice.payment_failed --forward-to localhost:3000/api/connect/webhook
```

Set `STRIPE_SECRET_KEY` and webhook secrets in `.env` (see `.env.example`).
