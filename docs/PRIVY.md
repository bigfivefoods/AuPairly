# Privy email verification (AuPairly)

Registration requires email OTP via [Privy](https://dashboard.privy.io) when configured.

## Env vars

| Variable | Where | Notes |
|----------|--------|--------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Vercel **Build + Runtime** | Public App ID |
| `PRIVY_APP_ID` | Runtime (optional alias) | Same as App ID |
| `PRIVY_APP_SECRET` | Runtime (secret) | Never public |
| `PRIVY_EMAIL_VERIFY_REQUIRED` | Runtime | Default on when Privy is configured; set `false` only for demos |
| `PRIVY_VERIFICATION_KEY` | Optional | Dashboard JWT key |
| `NEXT_PUBLIC_PRIVY_CLIENT_ID` | Optional | If Privy shows a client id |

## Dashboard checklist

1. [dashboard.privy.io](https://dashboard.privy.io) → your app  
2. Login methods → enable **Email**  
3. Allowed origins / domains:
   - `https://www.aupairly.me`
   - `https://aupairly.me`
   - `http://localhost:3000`
4. Copy App ID + App Secret into Vercel (and local `.env`)

## Deploy Privy to production

```bash
# With Vercel token: https://vercel.com/account/tokens
export VERCEL_TOKEN=...
# Ensure .env has NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET
./scripts/set-vercel-env.sh
```

Or set the two keys manually in **Vercel → aupairly → Settings → Environment Variables**, then **Redeploy**.

## Verify

| Check | Expected |
|--------|----------|
| `https://www.aupairly.me/register` | Email OTP form (not “Email verification required” setup card) |
| Local `POST /api/register` without token | Error asking for OTP |
| After OTP + register | User has `emailVerified` set |

## Code map

- Client: `src/app/(auth)/register/page.tsx` + `register/layout.tsx` (Privy only on register)
- Server verify: `src/lib/privy.ts` + `src/app/api/register/route.ts`
