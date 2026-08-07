# Didit international KYC (AuPairly) — live production

Didit powers **non–South Africa** automated identity checks (passport / national ID + liveness).  
South African IDs use **VerifyNow** instead.

Docs: [docs.didit.me](https://docs.didit.me) · Console: [business.didit.me](https://business.didit.me)

## Live status (this project)

| Item | Status |
|------|--------|
| API key | Set locally (`DIDIT_API_KEY`) — session create returns **201** |
| Workflow | Published UUID in `DIDIT_WORKFLOW_ID` |
| API base | `https://verification.didit.me/v3` |
| Webhook destination | `https://www.aupairly.me/api/verification/kyc/webhook` (label: *AuPairly production KYC*) |
| Webhook secret | Stored as `DIDIT_WEBHOOK_SECRET` in local `.env` |

**Still required:** copy the same three secrets to **Vercel Production** and redeploy.

## Vercel Production env

```bash
DIDIT_API_KEY=...                    # Business Console → API keys
DIDIT_WORKFLOW_ID=...                # published KYC workflow UUID
DIDIT_WEBHOOK_SECRET=...             # destination secret_shared_key
DIDIT_API_BASE=https://verification.didit.me/v3
NEXT_PUBLIC_SITE_URL=https://www.aupairly.me
```

Push from local `.env` (if you have a Vercel token):

```bash
export VERCEL_TOKEN=...
# ensure set-vercel-env.sh includes Didit keys (see scripts/set-vercel-env.sh)
./scripts/set-vercel-env.sh
```

Or set manually in Vercel → Settings → Environment Variables → Production, then **Redeploy**.

## Webhook destination (already registered via API)

| Field | Value |
|-------|--------|
| URL | `https://www.aupairly.me/api/verification/kyc/webhook` |
| Version | `v3` |
| Events | `status.updated`, `data.updated`, `user.status.updated`, `user.data.updated` |

Handler verifies `X-Signature-V2` (HMAC-SHA256, canonical JSON), with fallbacks.

In production, missing `DIDIT_WEBHOOK_SECRET` → **401 Invalid signature** (no unsigned webhooks).

## User flow

1. `/verification` → non-ZA country  
2. **Start international verification**  
3. `POST /v3/session/` with `workflow_id` + `vendor_data` (user id)  
4. Redirect to Didit hosted `url`  
5. Return to `/verification?kyc=didit&verificationSessionId=…&status=…`  
6. Webhook and/or `GET ?syncSession=` mark ID + SELFIE  
7. Verified badge when both steps pass  

## App routes

| Route | Role |
|-------|------|
| `POST /api/verification/kyc` | Start Didit session (non-ZA) |
| `GET /api/verification/kyc?syncSession=` | Reconcile after redirect |
| `POST /api/verification/kyc/webhook` | Didit status webhooks |

## Status mapping

| Didit | AuPairly |
|-------|----------|
| Approved | VERIFIED |
| Declined / Expired / Abandoned / Kyc Expired | REJECTED |
| In Review / In Progress / Resubmitted / Awaiting User | PENDING |

## Live checklist

1. [x] API key works (`POST /v3/session/` → 201)  
2. [x] Workflow UUID published  
3. [x] Webhook destination created for production URL  
4. [x] `DIDIT_WEBHOOK_SECRET` in local `.env`  
5. [ ] Same three env vars on **Vercel Production**  
6. [ ] Redeploy  
7. [ ] Logged-in `GET /api/verification/kyc` shows `"didit": { "live": true, "webhookConfigured": true }`  
8. [ ] Non-ZA verification end-to-end; badge updates on **Approved**  
9. [ ] Console **Try Webhook** hits production webhook with 200  

## Support

Didit: docs + console · AuPairly: hello@aupairly.me
