# Meta / Facebook Login setup (AuPairly)

> **Default: OFF.** Facebook is optional. Set `FACEBOOK_OAUTH_ENABLED=true` only after Meta
> App Domains + Valid OAuth Redirect URIs work. Until then, users upload photos + VerifyNow / docs.

Facebook is used for **profile enrichment only** (public name + photo + optional email).  
It is **not** government ID verification — users still complete VerifyNow (SA) or document upload for a Verified badge.

## 1. Create a Meta app

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps/)
2. **Create App** → use case **Authenticate and request data from users with Facebook Login**
3. App name: e.g. `AuPairly`
4. Add product: **Facebook Login** → **Web**
5. Site URL: `https://www.aupairly.me`

## 2. Fix “Can't load URL / domain isn't included”

**Domain Manager ≠ App Domains.** Domain Manager only verifies ownership.
Login checks **App settings → Basic → App Domains** + **Valid OAuth Redirect URIs**.

AuPairly **always** sends redirect_uri:

```text
https://www.aupairly.me/api/social/facebook/callback
```

(never `*.vercel.app` — code forces www product host except localhost)

### A. App settings → Basic (required)

| Setting | Value |
|---------|--------|
| **App Domains** | `aupairly.me` (**no** `https://`, **no** `www`, **no** `/`) |
| Privacy Policy URL | `https://www.aupairly.me/privacy` |
| Terms of Service URL | `https://www.aupairly.me/terms` |

Save Changes.

### B. Website platform

| Setting | Value |
|---------|--------|
| Site URL | `https://www.aupairly.me` |

### C. App authentication / Facebook Login

| Setting | Value |
|---------|--------|
| **Native or desktop app?** | **Off** |
| Valid OAuth Redirect URIs | `https://www.aupairly.me/api/social/facebook/callback` |
| Client OAuth login | Yes |
| Web OAuth login | Yes |
| Use Strict Mode for Redirect URIs | Yes |

### D. Vercel

```bash
NEXT_PUBLIC_SITE_URL=https://www.aupairly.me
AUTH_URL=https://www.aupairly.me
NEXT_PUBLIC_FACEBOOK_APP_ID=2132905357632800
AUTH_FACEBOOK_SECRET=...
```

AuPairly always uses redirect_uri:

`https://www.aupairly.me/api/social/facebook/callback`


## 3. Permissions

For standard Login, request:

- `public_profile` (default)
- `email`

Advanced permissions (friends lists, posts, etc.) are **not** needed and should not be requested.

## 4. Environment variables (Vercel + local)

```bash
# Public App ID (safe in the browser)
NEXT_PUBLIC_FACEBOOK_APP_ID="123456789012345"

# App Secret (server only — never NEXT_PUBLIC_)
AUTH_FACEBOOK_SECRET="your_app_secret"

# Optional aliases (either pair works)
# AUTH_FACEBOOK_ID="123456789012345"
# FACEBOOK_APP_SECRET="your_app_secret"
```

Also ensure:

```bash
NEXT_PUBLIC_SITE_URL="https://www.aupairly.me"
AUTH_URL="https://www.aupairly.me"
```

## 5. App modes

- **Development:** only users with a role on the app can log in (admins/developers/testers).
- **Live:** switch App Mode to **Live** after Meta review if you use restricted permissions.  
  For `public_profile` + `email` only, Live is usually enough without App Review.

## 6. User-facing entry points

| Page | Action |
|------|--------|
| `/settings/connections` | Connect / re-sync / unlink Facebook |
| `/verification` | Same connect control during KYC |
| `/api/social/facebook/oauth` | Starts OAuth redirect |
| `/api/social/facebook/callback` | Handles return from Meta |

## 7. What we store

On successful link, `User` is updated with:

- `facebookId` (unique)
- `facebookProfile` (JSON: name, email, picture, link, importedAt)
- `image` — only if the user had no photo yet
- `name` — only if name was empty/placeholder

Unlink clears `facebookId` and `facebookProfile` (does not delete the profile photo already saved).

## 8. Test checklist

1. App in Development → add yourself as tester
2. Open `/settings/connections` while logged into AuPairly
3. Click **Connect Facebook** → approve → land with `?fb=linked`
4. Confirm name/photo on dashboard if previously missing
5. Click **Unlink** → Facebook fields cleared

## Support

Meta app issues: [developers.facebook.com/support](https://developers.facebook.com/support/)  
AuPairly product: hello@aupairly.me
