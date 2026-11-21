#!/usr/bin/env bash
set -euo pipefail

API="${API_BASE:-http://127.0.0.1:8080}"

echo "== healthz =="
curl -sf "$API/healthz" | tee /tmp/paradise-healthz.json
echo
echo "== readyz =="
curl -sf "$API/readyz" | tee /tmp/paradise-readyz.json
echo
echo "== version =="
curl -sf "$API/api/v1/version" | tee /tmp/paradise-version.json
echo
echo "OK: API smoke passed"
