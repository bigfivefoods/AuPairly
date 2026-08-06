#!/usr/bin/env bash
set -euo pipefail
# Requires: vercel login OR VERCEL_TOKEN
# Usage: ./scripts/vercel-deploy.sh

TEAM_SCOPE="${VERCEL_SCOPE:-bigfivefoods-projects}"
PROJECT="${VERCEL_PROJECT:-aupairly}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN (https://vercel.com/account/tokens) or run: npx vercel login"
fi

export $(grep -v '^#' .env | xargs) || true

npx vercel link --yes --project "$PROJECT" --scope "$TEAM_SCOPE" ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}

# Set env vars for production
set_env() {
  local key="$1" val="$2"
  printf '%s' "$val" | npx vercel env add "$key" production --force ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} || true
}

set_env DATABASE_URL "$DATABASE_URL"
set_env AUTH_SECRET "${AUTH_SECRET:-$(openssl rand -base64 32)}"
set_env AUTH_URL "${AUTH_URL:-https://aupairly-bigfivefoods-projects.vercel.app}"
set_env NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-https://aupairly-bigfivefoods-projects.vercel.app}"
set_env NEXT_PUBLIC_SITE_NAME "AuPairly"
set_env AUTO_VERIFY "${AUTO_VERIFY:-true}"

npx vercel --prod --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
echo "Done. Attach domain www.aupairly.me in Vercel → Settings → Domains."
