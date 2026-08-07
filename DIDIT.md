# Didit international KYC (AuPairly)

Didit powers **non–South Africa** automated identity checks (passport / national ID + liveness).  
South African IDs use **VerifyNow** instead.

Docs: [docs.didit.me](https://docs.didit.me) · Console: [business.didit.me](https://business.didit.me)

## 1. Create application + workflow

1. Sign up at Didit Business Console
2. Create an **application** (sandbox first)
3. **Workflows → Create** a KYC workflow with document + liveness (and face match if desired)
4. **Publish** the workflow and copy its **workflow UUID**

## 2. API key

Console → API & Webhooks → create API key → store as `DIDIT_API_KEY` (server only).

## 3. Environment variables

```bash
DIDIT_API_KEY="..."
DIDIT_WORKFLOW_ID="11111111-2222-3333-4444-555555555555"
DIDIT_WEBHOOK_SECRET="..."   # from webhook destination create response
# Optional:
# DIDIT_API_BASE="https://verification.didit.me/v3"
```

Also ensure:

```bash
NEXT_PUBLIC_SITE_URL="https://www.aupairly.me"
```

## 4. Webhook destination

Create a destination (console or API):

| Field | Value |
|-------|--------|
| URL | `https://www.aupairly.me/api/verification/kyc/webhook` |
| Version | `v3` |
| Events | `status.updated`, `data.updated` |

Save the returned **`secret_shared_key`** as `DIDIT_WEBHOOK_SECRET`.

Our handler verifies `X-Signature-V2` (HMAC-SHA256, canonical JSON), with fallbacks to `X-Signature` and `X-Signature-Simple`.

## 5. User flow

1. User opens `/verification`, selects a non-ZA country
2. Clicks **Start international verification**
3. Backend `POST /v3/session/` with `workflow_id` + `vendor_data` (AuPairly user id)
4. User is redirected to Didit hosted `url`
5. On finish, Didit redirects to `/verification?kyc=didit&verificationSessionId=…&status=…`
6. Webhook (and/or callback sync) marks ID + SELFIE `VERIFIED` / `REJECTED` / `PENDING`
7. `refreshUserVerifiedBadge` updates the public Verified badge when both required steps pass

## 6. App routes

| Route | Role |
|-------|------|
| `POST /api/verification/kyc` | Start Didit session (non-ZA) |
| `GET /api/verification/kyc?syncSession=` | Reconcile session after redirect |
| `POST /api/verification/kyc/webhook` | Didit status webhooks |

## 7. Status mapping

| Didit status | AuPairly |
|--------------|----------|
| Approved | VERIFIED |
| Declined / Expired / Abandoned / Kyc Expired | REJECTED |
| In Review / In Progress / Resubmitted / Awaiting User | PENDING |

## 8. Test checklist

1. Sandbox app + published workflow
2. Set env vars on Vercel (preview + production)
3. Register webhook destination; use **Try Webhook** in console
4. Run a non-ZA verification from `/verification`
5. Confirm ID + Selfie rows update and badge refreshes on **Approved**

## Support

Didit: docs + console support  
AuPairly: hello@aupairly.me
