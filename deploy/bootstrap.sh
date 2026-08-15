#!/usr/bin/env bash
set -euo pipefail
APP_ROOT="${APP_ROOT:-/opt/apps/msp-api}"
echo "Use the backend bootstrap on the VM: ${APP_ROOT}/bootstrap.sh"
echo "This repo only adds the frontend image (compose profile 'web')."
cd "${APP_ROOT}"
docker compose --profile web pull frontend
docker compose --profile web up -d frontend
docker compose --profile web ps
