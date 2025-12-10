#!/usr/bin/env bash
set -euo pipefail

cd /srv/dorce.ai
git fetch --all
git reset --hard origin/main

echo "==> Reinstall systemd units if changed"
cp /srv/dorce.ai/deploy/systemd/dorce-frontend.service /etc/systemd/system/ || true
cp /srv/dorce.ai/deploy/systemd/dorce-backend.service /etc/systemd/system/ || true
systemctl daemon-reload || true

cd apps/frontend
npm install --no-audit --no-fund
npm run build

cd ../backend
npm install --no-audit --no-fund
npm run build
npx prisma migrate deploy || npx prisma db push

echo "==> Restart services"
systemctl restart dorce-frontend dorce-backend || true

echo "==> Reload Nginx if config present"
if [ -f /etc/nginx/sites-available/dorce.conf ]; then
  nginx -t && systemctl reload nginx || true
fi
