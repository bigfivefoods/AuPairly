#!/usr/bin/env bash
set -euo pipefail
# Requires: vercel login OR VERCEL_TOKEN
# Usage: ./scripts/vercel-deploy.sh

TEAM_SCOPE="${VERCEL_SCOPE:-bigfivefoods-projects}"
PROJECT="${VERCEL_PROJECT:-aupairly}"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Set VERCEL_TOKEN (https://vercel.com/account/tokens) or run: npx vercel login"
fi

# Load .env without breaking on spaces
set -a
# shellcheck disable=SC1091
source <(grep -v '^#' .env | sed 's/^/export /')
set +a

npx vercel link --yes --project "$PROJECT" --scope "$TEAM_SCOPE" ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}

set_env() {
  local key="$1" val="${2:-}"
  if [[ -z "$val" ]]; then
    echo "skip empty $key"
    return 0
  fi
  printf '%s' "$val" | npx vercel env add "$key" production --force --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} 2>/dev/null \
    || printf '%s' "$val" | npx vercel env add "$key" production --force ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} || true
  # also preview
  printf '%s' "$val" | npx vercel env add "$key" preview --force --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} 2>/dev/null \
    || printf '%s' "$val" | npx vercel env add "$key" preview --force ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"} || true
}

set_env DATABASE_URL "${DATABASE_URL:-}"
set_env DIRECT_URL "${DIRECT_URL:-}"
set_env NEXT_PUBLIC_SUPABASE_URL "${NEXT_PUBLIC_SUPABASE_URL:-}"
set_env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-}"
set_env AUTH_SECRET "${AUTH_SECRET:-$(openssl rand -base64 32)}"
set_env AUTH_URL "${AUTH_URL:-https://www.aupairly.me}"
set_env NEXT_PUBLIC_SITE_URL "${NEXT_PUBLIC_SITE_URL:-https://www.aupairly.me}"
set_env NEXT_PUBLIC_SITE_NAME "${NEXT_PUBLIC_SITE_NAME:-AuPairly}"
set_env AUTO_VERIFY "${AUTO_VERIFY:-false}"

# Stripe real payments
set_env STRIPE_SECRET_KEY "${STRIPE_SECRET_KEY:-}"
set_env NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}"
set_env STRIPE_WEBHOOK_SECRET "${STRIPE_WEBHOOK_SECRET:-}"
set_env STRIPE_PRICE_PLUS_PARENT "${STRIPE_PRICE_PLUS_PARENT:-}"
set_env STRIPE_PRICE_PLUS_AUPAIR "${STRIPE_PRICE_PLUS_AUPAIR:-}"
set_env STRIPE_PRICE_PREMIUM_PARENT "${STRIPE_PRICE_PREMIUM_PARENT:-}"
set_env STRIPE_PRICE_PREMIUM_AUPAIR "${STRIPE_PRICE_PREMIUM_AUPAIR:-}"

npx vercel --prod --yes ${VERCEL_TOKEN:+--token "$VERCEL_TOKEN"}
echo "Done. Webhook endpoint: https://www.aupairly.me/api/billing/webhook"
