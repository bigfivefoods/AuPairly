# Point aupairly.me → Vercel (you own the domain)

Vercel project: **aupairly**  
https://vercel.com/bigfivefoods-projects/aupairly/settings/domains

## 1. Add the domain in Vercel (if not already)

1. Open Domains settings (link above)
2. Add **`aupairly.me`**
3. Add **`www.aupairly.me`** (or choose “redirect www → apex” / “apex → www” — recommend **apex → www** or **www → apex**, pick one primary)
4. Vercel will show exact DNS values — use those if they differ from below

## 2. At your domain registrar (where you bought the domain)

Log into Namecheap / GoDaddy / Cloudflare / Google Domains / etc. and edit **DNS**.

### Recommended records

| Type | Name / Host | Value | TTL |
|------|-------------|--------|-----|
| **A** | `@` (or blank / root) | `76.76.21.21` | Auto / 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com` | Auto / 3600 |

### Important

- **Remove** any old A/AAAA/CNAME records for `@` or `www` that point elsewhere (old host, parking page, etc.).
- Keep **MX** records if you use email on this domain.
- If Vercel asks for a **TXT** verification record, add it exactly as shown, wait for verify, then you can remove it if Vercel says so.

## 3. Wait for DNS

- Often works in **5–30 minutes**
- Can take up to **24–48 hours**

Check:

```bash
dig aupairly.me A +short
# should show: 76.76.21.21

dig www.aupairly.me CNAME +short
# should show: cname.vercel-dns.com (or similar)
```

Or: https://dnschecker.org/#A/aupairly.me

## 4. SSL

Once DNS is correct, Vercel issues a free HTTPS certificate automatically.  
Status should show **Valid** next to the domain in Vercel Domains.

## 5. App env (after domain works)

In Vercel env vars, set:

```
AUTH_URL=https://www.aupairly.me
NEXT_PUBLIC_SITE_URL=https://www.aupairly.me
```

(or `https://aupairly.me` if you made apex primary)

Then **Redeploy**.

---

## Also required: Supabase env vars

Domain alone is not enough. Without `DATABASE_URL` / `DIRECT_URL` the site stays **500**.

See **GO_LIVE.md** and local file **`vercel-env-to-paste.env`**.
