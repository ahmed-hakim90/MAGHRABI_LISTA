#!/usr/bin/env bash
# Usage: ./scripts/vercel-check-deployment.sh "https://your-app.vercel.app"
# Prints curl -I results and a short interpretation for Vercel 403/404 debugging.

set -euo pipefail

BASE="${1:-}"
if [[ -z "$BASE" ]]; then
  echo "Usage: $0 <base-url>" >&2
  echo "Example: $0 https://my-project-xxx.vercel.app" >&2
  exit 1
fi

BASE="${BASE%/}"

paths=(
  "/"
  "/manifest.webmanifest"
  "/sw.js"
  "/icons/icon-192.png"
)

echo "=== Vercel / public route probe ==="
echo "Base: $BASE"
echo

for p in "${paths[@]}"; do
  url="${BASE}${p}"
  echo "--- HEAD $url ---"
  if ! out=$(curl -sS -I -L --max-time 15 "$url" 2>&1); then
    echo "curl failed: $out"
    echo
    continue
  fi
  echo "$out" | head -20
  echo
done

echo "=== Interpretation hints ==="
echo "- x-vercel-error: DEPLOYMENT_BLOCKED → turn off Deployment Protection / Vercel Auth for Production"
echo "- Set-Cookie _vercel_sso_nonce + login HTML → SSO / Vercel Authentication"
echo "- x-vercel-error: NOT_FOUND / DEPLOYMENT_NOT_FOUND → wrong hostname or domain not linked to this deployment"
echo "- HTTP 200, no Vercel block → app reachable; check browser Network for Firebase if data missing"
echo
echo "Full runbook: docs/vercel-production-access.md"
