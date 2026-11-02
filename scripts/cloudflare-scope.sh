#!/usr/bin/env bash
# Checks that CLOUDFLARE_API_TOKEN can do what `wrangler deploy` needs on each zone
# given as an argument: see the zone and edit its Workers routes, plus the account's
# Workers custom domains. (Custom domains need no DNS permission: Cloudflare makes
# their records itself.) Writes nothing: an edit probe
# sends an empty body, which a token with the permission gets back as a validation
# error (400) and one without it as an authentication error (403). Prints no token.
set -uo pipefail

api=https://api.cloudflare.com/client/v4
: "${CLOUDFLARE_API_TOKEN:?not set}" "${CLOUDFLARE_ACCOUNT_ID:?not set}"
missing=0
out=$(mktemp)
trap 'rm -f "$out"' EXIT

call() { # method path [body] -> prints the HTTP status
  local method=$1 path=$2 body=${3-}
  curl -s -o "$out" -w '%{http_code}' -X "$method" "$api$path" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" -H 'Content-Type: application/json' \
    ${body:+--data "$body"}
}

report() { # label status allowed-statuses...
  local label=$1 status=$2; shift 2
  for ok in "$@"; do
    if [ "$status" = "$ok" ]; then echo "ok       $label ($status)"; return; fi
  done
  echo "MISSING  $label ($status)"
  missing=1
}

report "token is valid" "$(call GET /user/tokens/verify)" 200
report "account: list Workers custom domains" "$(call GET "/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains")" 200
report "account: edit Workers custom domains" "$(call PUT "/accounts/$CLOUDFLARE_ACCOUNT_ID/workers/domains" '{}')" 400 422

for zone in "$@"; do
  status=$(call GET "/zones?name=$zone")
  id=$(jq -r '.result[0].id // empty' "$out" 2>/dev/null)
  if [ -z "$id" ]; then
    echo "MISSING  $zone: the token can't see the zone ($status)"
    missing=1
    continue
  fi
  echo "ok       $zone: zone visible, status $(jq -r '.result[0].status' "$out")"
  report "$zone: read Workers routes" "$(call GET "/zones/$id/workers/routes")" 200
  report "$zone: edit Workers routes" "$(call POST "/zones/$id/workers/routes" '{}')" 400 422
done

exit $missing
