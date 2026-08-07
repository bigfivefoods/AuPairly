# VerifyNow on Vercel (production)

Required environment variables (Production + Preview):

```
VERIFYNOW_API_KEY=vn_live_...
VERIFYNOW_MODE=production
```

Optional:

```
KYC_VERIFYNOW_FEE_CENTS=1000
```

After changing env vars: **Redeploy** production so the runtime picks them up.

Live check (logged in): `GET /api/verification/kyc` should show:

```json
"verifynow": { "mode": "production", "live": true, "configured": true }
```
