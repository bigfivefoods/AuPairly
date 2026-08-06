<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AuPairly project conventions

## Database = Supabase only

- Host: **Supabase Postgres** project `bpbxjzgzyfbpkujrfzks`
- Dashboard: https://supabase.com/dashboard/project/bpbxjzgzyfbpkujrfzks
- **Do not** recommend or configure Prisma Postgres, Neon, or SQLite for this app.
- Prisma uses:
  - `DATABASE_URL` — Supabase **Transaction** pooler (port **6543**, `?pgbouncer=true`)
  - `DIRECT_URL` — Supabase **Session/Direct** (port **5432**) for migrations
- Public API (already used in app helpers):
  - `NEXT_PUBLIC_SUPABASE_URL=https://bpbxjzgzyfbpkujrfzks.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
- Auth for the product is **Auth.js** (credentials), not Supabase Auth (unless explicitly requested later).
- Docs: `SUPABASE.md`, `DEPLOY.md`
