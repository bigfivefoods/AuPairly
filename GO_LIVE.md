# Go live — www.aupairly.me

**Current status (checked automatically):**

| Item | Status |
|------|--------|
| GitHub → Vercel connected | ✅ Deploys on push to `main` |
| Latest production deploy | ✅ Build READY |
| Supabase DB + seed data | ✅ Working (local / Codespace) |
| Vercel env vars (Supabase DB) | ⚠️ **Still missing** → listings show “database not configured” |
| Domain `www.aupairly.me` | ✅ Live |

**Public site:** https://www.aupairly.me  
**Vercel alias:** https://aupairly-orcin.vercel.app  

---

## Step 1 — Add environment variables on Vercel (required)

1. Open: https://vercel.com/bigfivefoods-projects/aupairly/settings/environment-variables  
2. Add **each** key below for **Production** and **Preview**  
3. Ensure they apply to **Build** and **Runtime**

You can also open the local file **`vercel-env-to-paste.env`** (in your project root; not on GitHub) and copy values from there.

| Name | What it is |
|------|------------|
| `DATABASE_URL` | Supabase Transaction pooler (`…pooler.supabase.com:6543…?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Session pooler (`…:5432…`) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bpbxjzgzyfbpkujrfzks.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your publishable key |
| `AUTH_SECRET` | Long random secret (see paste file) |
| `AUTH_URL` | `https://www.aupairly.me` (or temporary Vercel URL until domain works) |
| `NEXT_PUBLIC_SITE_URL` | Same as `AUTH_URL` |
| `NEXT_PUBLIC_SITE_NAME` | `AuPairly` |
| `AUTO_VERIFY` | `true` |

4. **Deployments → Redeploy** the latest production deployment  
   (check “Use existing Build Cache” = **off** if first time with new env)

When this is correct, https://aupairly-orcin.vercel.app should load the AuPairly homepage (not 500).

---

## Step 2 — Domain www.aupairly.me

The project already lists `aupairly.me` and `www.aupairly.me`, but **public DNS does not resolve yet**.

### If you already own the domain elsewhere

At your registrar (Namecheap, GoDaddy, Cloudflare, etc.), set:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

(Or use the exact records shown under Vercel → Domains.)

### If you do **not** own it yet

Register it (~$27/year), then attach:

- Vercel: https://vercel.com/domains/search?q=aupairly.me  
- Or tell me to buy it on Vercel for the team (I need your OK + WHOIS contact details — that charges your card).

After DNS works (can take a few minutes–48h):

- Set `AUTH_URL` and `NEXT_PUBLIC_SITE_URL` to `https://www.aupairly.me`  
- Redeploy once  

---

## Step 3 — Smoke test

1. https://www.aupairly.me (or Vercel URL) loads  
2. Log in: `parent@demo.aupairly.me` / `demo1234`  
3. Browse au pairs / messages  

---

## Links

| | |
|--|--|
| Vercel project | https://vercel.com/bigfivefoods-projects/aupairly |
| Domains | https://vercel.com/bigfivefoods-projects/aupairly/settings/domains |
| Env vars | https://vercel.com/bigfivefoods-projects/aupairly/settings/environment-variables |
| Supabase | https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks |
| GitHub | https://github.com/bigfivefoods/AuPairly |
