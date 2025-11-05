# Deployment Guide

## Building for Production

```bash
# Install dependencies
pnpm install

# Build both server and client
pnpm build
```

This creates:
- `dist/server/` - Compiled server TypeScript to JavaScript
- `dist/client/static/` - Built client assets (React app)

## Running in Production

### Option 1: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Option 2: Direct Node

```bash
pnpm start
# or
NODE_ENV=production node dist/server/index.js
```

## Server Requirements

- **Node.js**: v18+ (v20+ recommended)
- **RAM**: 512MB minimum, 1GB+ recommended
- **Storage**: 1GB+ for app and uploads
- **OS**: Any (tested on Debian 12)

## Nginx Reverse Proxy (Optional)

Create `/etc/nginx/sites-available/expense-tracker`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable:
```bash
sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Data Persistence

All data stored in `.storage/` directory:
- User accounts
- Income/Expense records
- Uploaded receipts
- Balance overrides

**Backup command:**
```bash
tar -czf backup-$(date +%Y%m%d).tar.gz .storage/
```

## Environment Variables

The app uses these environment variables (all optional):
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Set to `production` for production mode

## Default Credentials

- **Username**: admin
- **Password**: admin

**⚠️ Change immediately after first login!**

## PM2 Commands

```bash
pm2 status              # Check status
pm2 logs expense-tracker # View logs
pm2 restart expense-tracker # Restart
pm2 stop expense-tracker    # Stop
pm2 delete expense-tracker  # Remove
```

## Troubleshooting

**Port already in use:**
```bash
# Change PORT in ecosystem.config.cjs or:
PORT=8080 pm2 start ecosystem.config.cjs
```

**Permission errors on .storage:**
```bash
chmod -R 755 .storage/
chown -R $USER:$USER .storage/
```

**Build fails:**
```bash
# Clean and rebuild
rm -rf dist/ node_modules/
pnpm install
pnpm build
```
