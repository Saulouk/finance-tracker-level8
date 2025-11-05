#!/bin/bash

# Create deployment package
echo "Creating deployment package..."

# Create temp directory
rm -rf deploy-package
mkdir -p deploy-package

# Copy built files
cp -r dist deploy-package/
cp ecosystem.config.cjs deploy-package/
cp package.json deploy-package/
cp pnpm-lock.yaml deploy-package/

# Create .storage directory structure
mkdir -p deploy-package/.storage/uploads

# Create README for deployment
cat > deploy-package/DEPLOY.md << 'EOF'
# Deployment Instructions

## 1. Upload to Server
Upload this entire folder to your server, e.g.:
```bash
scp -r deploy-package/* user@your-server:/var/www/expense-tracker/
```

## 2. On the Server
```bash
cd /var/www/expense-tracker

# Install dependencies (production only)
pnpm install --prod

# Create logs directory
mkdir -p logs

# Set permissions
chmod -R 755 .storage/

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 3. Configure Nginx (Optional)
See main DEPLOYMENT.md for Nginx configuration.

## Default Login
- Username: admin
- Password: admin
- **Change immediately after first login!**

## Port
Default: 3000 (change in ecosystem.config.cjs if needed)
EOF

# Create archive
tar -czf expense-tracker-deploy.tar.gz deploy-package/

echo "✓ Deployment package created: expense-tracker-deploy.tar.gz"
echo "  Upload this file to your server and extract it."
