#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo bash deploy/scripts/bootstrap-hostinger.sh \
#     --domain example.com \
#     --repo https://github.com/dorceinnovative/dorce.ai.git \
#     [--api-subdomain api.example.com]
#
# Notes:
# - Expects Ubuntu 22.04+
# - Installs Node 20, Nginx, Certbot
# - Clones repo into /srv/dorce.ai
# - Builds frontend (port 3000) and backend (port 4000)
# - Configures systemd services
# - Sets up Nginx reverse proxy and SSL

DOMAIN=""
REPO="https://github.com/dorceinnovative/dorce.ai.git"
API_SUBDOMAIN=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain)
      DOMAIN="$2"; shift; shift ;;
    --repo)
      REPO="$2"; shift; shift ;;
    --api-subdomain)
      API_SUBDOMAIN="$2"; shift; shift ;;
    *)
      echo "Unknown argument: $1"; exit 1 ;;
  esac
done

if [[ -z "$DOMAIN" ]]; then
  echo "--domain is required"; exit 1
fi

echo "==> Updating packages"
apt update -y
apt install -y nginx git curl

echo "==> Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "==> Installing Certbot"
snap install core || true
snap refresh core || true
snap install --classic certbot || true
ln -sf /snap/bin/certbot /usr/bin/certbot

echo "==> Preparing /srv/dorce.ai"
mkdir -p /srv/dorce.ai
chown root:root /srv/dorce.ai

if [[ ! -d "/srv/dorce.ai/.git" ]]; then
  echo "==> Cloning repository: $REPO"
  git clone "$REPO" /srv/dorce.ai
else
  echo "==> Repo exists, pulling latest"
  cd /srv/dorce.ai && git pull --ff-only
fi

echo "==> Install and build frontend"
cd /srv/dorce.ai/apps/frontend
npm ci
npm run build

echo "==> Install and build backend"
cd /srv/dorce.ai/apps/backend
npm ci
npm run build
echo "==> Apply Prisma migrations (best-effort)"
npx prisma migrate deploy || npx prisma db push || true

echo "==> Install systemd services"
cp /srv/dorce.ai/deploy/systemd/dorce-frontend.service /etc/systemd/system/
cp /srv/dorce.ai/deploy/systemd/dorce-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable dorce-frontend dorce-backend
systemctl restart dorce-frontend dorce-backend

echo "==> Configure Nginx"
cp /srv/dorce.ai/deploy/nginx/dorce.conf /etc/nginx/sites-available/dorce.conf
sed -i "s/your-domain/$DOMAIN/g" /etc/nginx/sites-available/dorce.conf
ln -sf /etc/nginx/sites-available/dorce.conf /etc/nginx/sites-enabled/dorce.conf
nginx -t
systemctl reload nginx

echo "==> Issue SSL cert"
if [[ -n "$API_SUBDOMAIN" ]]; then
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_SUBDOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN" || true
else
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m admin@"$DOMAIN" || true
fi

echo "==> Deployment complete"
echo "Check:"
echo "  curl -I https://$DOMAIN"
echo "  curl -s https://$DOMAIN/api/health"

