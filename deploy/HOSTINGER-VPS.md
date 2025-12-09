Hostinger VPS Deployment (Full Stack)

Overview
- Frontend (Next.js) on port `3000`, Backend (NestJS) on port `4000`
- Nginx reverse proxy: `https://your-domain` → frontend, `https://your-domain/api` → backend
- SSL via Certbot
- Systemd services to keep both apps running

Prereqs
- VPS with Ubuntu 22.04+ (Hostinger VPS)
- SSH access (IP, username, port)
- Domain DNS pointing to VPS public IP (A record)

Install base packages
```bash
sudo apt update
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Clone repository
```bash
sudo mkdir -p /srv/dorce.ai
sudo chown $USER:$USER /srv/dorce.ai
git clone https://github.com/dorceinnovative/dorce.ai.git /srv/dorce.ai
```

Prepare environment
- Copy `apps/backend/.env.example` to `/srv/dorce.ai/apps/backend/.env` and fill values
- Copy `apps/frontend/.env.production.example` to `/srv/dorce.ai/apps/frontend/.env.production` if needed

Build frontend
```bash
cd /srv/dorce.ai/apps/frontend
npm ci
npm run build
```

Build backend
```bash
cd /srv/dorce.ai/apps/backend
npm ci
npm run build
# Run Prisma migrations (adjust for your DB)
npx prisma migrate deploy || npx prisma db push
```

Systemd services
```bash
sudo cp /srv/dorce.ai/deploy/systemd/dorce-frontend.service /etc/systemd/system/
sudo cp /srv/dorce.ai/deploy/systemd/dorce-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable dorce-frontend dorce-backend
sudo systemctl start dorce-frontend dorce-backend
sudo systemctl status dorce-frontend dorce-backend
```

Nginx & SSL
```bash
sudo cp /srv/dorce.ai/deploy/nginx/dorce.conf /etc/nginx/sites-available/dorce.conf
sudo sed -i 's/your-domain/example.com/g' /etc/nginx/sites-available/dorce.conf # replace domain
sudo ln -s /etc/nginx/sites-available/dorce.conf /etc/nginx/sites-enabled/dorce.conf
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com
```

Verification
```bash
curl -I https://example.com
curl -s https://example.com/api/health
```

Notes
- If using subdomains (e.g., `api.example.com`), adjust Nginx accordingly.
- For Cloudflare DNS, ensure proxy and SSL settings align (Full/Strict).
- Update `NEXT_PUBLIC_API_URL` in the frontend to match your backend route.
