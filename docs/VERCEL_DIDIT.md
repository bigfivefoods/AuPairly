# Didit on Vercel (live)

Set these on **Production** (and Preview if you test previews):

```
DIDIT_API_KEY=
DIDIT_WORKFLOW_ID=
DIDIT_WEBHOOK_SECRET=
DIDIT_API_BASE=https://verification.didit.me/v3
```

Values live in local `.env` after setup. Webhook destination is already registered in Didit Console for:

`https://www.aupairly.me/api/verification/kyc/webhook`

After setting env: **Redeploy** production.

Logged-in check: `GET /api/verification/kyc` → `"didit": { "live": true, "webhookConfigured": true }`.
