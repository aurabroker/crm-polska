#!/bin/bash
# Deploy CRM do Cloudflare Pages
# Wymaganie: token z https://dash.cloudflare.com/profile/api-tokens

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Ustaw token: export CLOUDFLARE_API_TOKEN=twoj_token"
  exit 1
fi

pnpm build && npx wrangler pages deploy dist \
  --project-name crm-polska \
  --account-id 1f52c869d091ebf55a2d1789dad4842d
