# AuPairly SEO

## Foundation (implemented)

| Asset | Path |
|-------|------|
| Site URL helpers + metadata builder | `src/lib/seo.ts` |
| JSON-LD component | `src/components/json-ld.tsx` |
| Dynamic sitemap | `/sitemap.xml` → `src/app/sitemap.ts` |
| Robots | `/robots.txt` → `src/app/robots.ts` |
| Root metadata | `src/app/layout.tsx` |
| Home Organization + WebSite + FAQ | `src/app/page.tsx` |
| Service landings | `/childcare`, `/caregiving`, `/house-sitting`, `/pet-sitting` |
| Browse + city + profile metadata | browse + cities routes |

## After deploy

1. Open [Google Search Console](https://search.google.com/search-console) → property `https://www.aupairly.me`
2. Verify ownership (DNS or HTML tag). Optional env: `GOOGLE_SITE_VERIFICATION=...`
3. Submit sitemap: `https://www.aupairly.me/sitemap.xml`
4. Confirm robots: `https://www.aupairly.me/robots.txt`
5. Rich Results Test on home + a public sitter URL
6. Keep `NEXT_PUBLIC_SITE_URL=https://www.aupairly.me` on Vercel Production

## Content tips (ongoing)

- Unique headlines/bios on listings (already used in profile metadata)
- City pages + service landings are primary keyword entry points
- Prefer verified profiles (trust signals help conversion and quality)
- Internal links: home → services → browse → cities → profiles
