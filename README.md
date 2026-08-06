# AuPairly

**AuPairly** is an online au pair platform that connects host families with qualified, verified au pairs from around the world.

## Features

- 🔍 **Browse Au Pairs** — Search and filter verified au pairs by nationality, language, experience, and availability
- 👨‍👩‍👧‍👦 **For Families** — Post family listings and find trusted childcare with cultural exchange
- ✅ **Verified Profiles** — All au pairs undergo identity verification and reference checks
- 💬 **Direct Messaging** — Communicate securely with candidates before committing
- 🌍 **Global Network** — 60+ countries supported
- 📋 **How It Works** — Step-by-step guidance for both families and au pairs

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and featured au pairs |
| `/au-pairs` | Browse all au pairs with search filters |
| `/au-pairs/[id]` | Individual au pair profile |
| `/families` | Information and sample profiles for host families |
| `/how-it-works` | Step-by-step guide + FAQ |
| `/sign-up` | Registration page for families and au pairs |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
```
