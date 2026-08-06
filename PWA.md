# AuPairly PWA & push

**Positioning:** Trusted care for your family, loved ones, home & pets.

## What you get

- Installable app (home screen) via Web App Manifest
- Service worker: offline shell + cached assets
- Web Push for messages, matches, interests (via `createNotification`)
- Mobile bottom nav + safe-area padding
- Settings: `/settings/notifications`

## Local setup

```bash
npx web-push generate-vapid-keys
```

Add to `.env`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=B...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:hello@aupairly.me
```

Then:

```bash
npx prisma migrate deploy
npm run dev
```

Open in Chrome/Edge (desktop or Android). Log in → enable push on dashboard or `/settings/notifications`.

## Production (Vercel)

1. Add the same VAPID vars for **Production** (and Preview if needed).
2. Site must be **HTTPS**.
3. Redeploy after env changes.
4. iOS: install via Safari → Share → Add to Home Screen; push requires iOS 16.4+ and installed PWA.

## Files

| Path | Role |
|------|------|
| `public/sw.js` | Service worker |
| `public/manifest.webmanifest` | Install metadata + shortcuts |
| `public/icons/*` | App icons |
| `src/lib/push.ts` | VAPID send helper |
| `src/app/api/push/*` | Subscribe / VAPID / test |
| `src/components/pwa-provider.tsx` | Register SW, install + push UI |

## Note

In-app notifications still go to the notification center. Push is an extra channel for devices that subscribed.
