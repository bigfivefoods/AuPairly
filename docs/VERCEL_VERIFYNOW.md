# VerifyNow + Paystack live (production)

## Real money = Paystack LIVE keys

VerifyNow identity checks and Paystack fees are separate:

| System | What it does | Live env |
|--------|----------------|----------|
| **VerifyNow** | SA Home Affairs ID / face (credits) | `VERIFYNOW_API_KEY=vn_live_…` |
| **Paystack** | R10 Free-plan fee (real card charge) | `sk_live_…` + `pk_live_…` |

If Paystack still has **`sk_test_` / `pk_test_`**, the checkout is sandbox — **no real payment**.

### Vercel Production environment variables

```bash
# VerifyNow (Home Affairs credits)
VERIFYNOW_API_KEY=vn_live_...
# Optional: vn_live_ keys always run production unless VERIFYNOW_FORCE_SANDBOX=true
VERIFYNOW_MODE=production

# Paystack LIVE (real ZAR charges) — from dashboard.paystack.com → Settings → API Keys & Webhooks
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...
PAYSTACK_CURRENCY=ZAR

# Free-plan VerifyNow fee (cents). Default 1000 = R10
KYC_VERIFYNOW_FEE_CENTS=1000
```

Optional escape hatch (not recommended on production):

```bash
PAYSTACK_ALLOW_TEST=true   # allow sk_test_ checkouts on Vercel production
```

### After changing env

1. Save variables for **Production** (and Preview if needed).
2. **Redeploy** production (env is baked at build for `NEXT_PUBLIC_*`).
3. Logged-in check: `GET /api/verification/kyc` should include:

```json
{
  "verifynow": { "mode": "production", "live": true, "configured": true },
  "paystack": { "mode": "live", "live": true, "configured": true }
}
```

On `/verification` the status line should show:

- `VerifyNow ● production (live)`
- `Paystack ● live payments`

If you see `Paystack ○ TEST mode`, keys are still test — replace them and redeploy.

### Local `.env`

Same keys. Keep `sk_test_` / `pk_test_` for local development if you prefer; production must use live.
