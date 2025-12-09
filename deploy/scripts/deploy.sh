#!/usr/bin/env bash
set -euo pipefail

cd /srv/dorce.ai
git fetch --all
git reset --hard origin/main

cd apps/frontend
npm install --no-audit --no-fund
npm run build

cd ../backend
npm install --no-audit --no-fund
npm run build
npx prisma migrate deploy || npx prisma db push

systemctl restart dorce-frontend dorce-backend || true
