#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
SERVICE_NAME="snap-proxy"
REGION="${1:-us-central1}"
PROXY_SECRET="${PROXY_SECRET:-}"

echo "[*] Building and deploying to $REGION..."

ENV_VARS="PROXY_SECRET=${PROXY_SECRET}"

gcloud run deploy "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --source . \
  --allow-unauthenticated \
  --set-env-vars "$ENV_VARS" \
  --max-instances 10 \
  --min-instances 0 \
  --concurrency 1 \
  --cpu 1 \
  --memory 256Mi \
  --timeout 30 \
  --quiet

URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --format "value(status.url)")

echo "[*] Deployed: $URL"
echo "$REGION $URL" >> proxy_urls.txt
echo "[*] Saved to proxy_urls.txt"
