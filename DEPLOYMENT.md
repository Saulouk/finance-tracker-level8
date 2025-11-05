# Production Deployment Guide for Debian 12

Complete guide to deploy the Expense Tracker to your Debian 12 VPS with PM2 and Nginx.

---

## 📋 Server Requirements

- **OS**: Debian 12 (or Ubuntu 20.04+)
- **Node.js**: v20+ (LTS recommended)
- **pnpm**: Latest version
- **PM2**: For process management
- **Nginx**: For reverse proxy
- **RAM**: 1GB minimum, 2GB+ recommended
- **Storage**: 2GB+ for app, dependencies, and uploads
- **Port**: 3000 (Node.js), 80/443 (Nginx)

---

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install build tools (needed for bcrypt)
sudo apt install -y build-essential python3
```

### 2. Upload Your Application

**Method A: Git Clone (Recommended)**
```bash
# Clone your repository
cd /var/www
sudo mkdir -p expense-tracker
sudo chown $USER:$USER expense-tracker
git clone <your-git-repo-url> expense-tracker
cd expense-tracker
```

**Method B: Direct Upload**
```bash
# On your local machine, create a tarball
tar -czf expense-tracker.tar.gz \
  dist/ \
  package.json \
  pnpm-lock.yaml \
  ecosystem.config.cjs

# Upload to server
scp expense-tracker.tar.gz user@your-server:~

# On server, extract
mkdir -p /var/www/expense-tracker
cd /var/www/expense-tracker
tar -xzf ~/expense-tracker.tar.gz
```

### 3. Build on Server (if using Git method)

```bash
cd /var/www/expense-tracker

# Install all dependencies
pnpm install

# Build the application
pnpm build

# Install production dependencies only (removes dev dependencies)
rm -rf node_modules
pnpm install --prod
```

### 4. Create Required Directories

```bash
# Create storage and logs directories
mkdir -p .storage/uploads
mkdir -p logs

# Set permissions
chmod -R 755 .storage/
chown -R $USER:$USER .storage/
```

### 5. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.cjs

# Check status (should show "online")
pm2 status

# View logs
pm2 logs expense-tracker --lines 50

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Run the command it outputs (will be something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
```

### 6. Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/expense-tracker

# Edit the file and replace "your-domain.com" with your actual domain
sudo nano /etc/nginx/sites-available/expense-tracker

# Enable the site
sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 7. Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot will automatically update your Nginx config
# Test auto-renewal
sudo certbot renew --dry-run
```

### 8. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## ✅ Verification

### Test Node.js App Directly
```bash
# Check if app is responding on port 3000
curl http://localhost:3000

# Should return HTML content
```

### Test PM2
```bash
pm2 status
# Should show: expense-tracker | online

pm2 logs expense-tracker --lines 20
# Should show: "Server starting on http://localhost:3000"
```

### Test Nginx
```bash
# Check Nginx status
sudo systemctl status nginx

# Test from outside
curl http://your-domain.com
# Should return the app
```

### Access the App
Open browser: `http://your-domain.com` or `https://your-domain.com`

**Default Login:**
- Username: `admin`
- Password: `admin`

**⚠️ CHANGE PASSWORD IMMEDIATELY!**

---

## 🔄 Updating the Application

### Method 1: Git Pull
```bash
cd /var/www/expense-tracker
git pull
pnpm install
pnpm build
pm2 restart expense-tracker
```

### Method 2: Upload New Build
```bash
# On local machine
pnpm build
scp -r dist/ user@server:/var/www/expense-tracker/

# On server
pm2 restart expense-tracker
```

---

## 📊 PM2 Management

### Basic Commands
```bash
pm2 start ecosystem.config.cjs   # Start app
pm2 stop expense-tracker          # Stop app
pm2 restart expense-tracker       # Restart app
pm2 reload expense-tracker        # Reload (zero-downtime)
pm2 delete expense-tracker        # Remove from PM2
pm2 logs expense-tracker          # View logs
pm2 monit                         # Monitor resources
pm2 flush                         # Clear logs
```

### Advanced
```bash
# Start with custom port
PORT=8080 pm2 start ecosystem.config.cjs

# View specific log file
pm2 logs expense-tracker --err    # Error logs only
pm2 logs expense-tracker --out    # Output logs only

# Scale to multiple instances (cluster mode)
pm2 scale expense-tracker 2       # Run 2 instances
```

---

## 💾 Backup & Restore

### Backup Data
```bash
# Create backup with timestamp
tar -czf expense-tracker-backup-$(date +%Y%m%d-%H%M%S).tar.gz .storage/

# Backup to remote location
scp expense-tracker-backup-*.tar.gz user@backup-server:/backups/
```

### Restore Data
```bash
# Extract backup
tar -xzf expense-tracker-backup-YYYYMMDD-HHMMSS.tar.gz

# Restart app
pm2 restart expense-tracker
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /var/www/expense-tracker && tar -czf /backups/expense-tracker-$(date +\%Y\%m\%d).tar.gz .storage/
```

---

## 🔧 Troubleshooting

### App Won't Start
```bash
# Check PM2 logs
pm2 logs expense-tracker --lines 100

# Check if port 3000 is available
sudo lsof -i :3000

# Kill process on port 3000
sudo kill -9 $(sudo lsof -t -i:3000)

# Try starting directly with Node
cd /var/www/expense-tracker
NODE_ENV=production node dist/server/server.js
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install --prod

# Rebuild if needed
pnpm build
```

### Permission Errors
```bash
# Fix ownership
sudo chown -R $USER:$USER /var/www/expense-tracker

# Fix permissions
chmod -R 755 .storage/
chmod -R 755 dist/
chmod 644 ecosystem.config.cjs
```

### Nginx Errors
```bash
# Test config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database/Storage Issues
```bash
# Check .storage directory
ls -la .storage/

# Recreate if missing
mkdir -p .storage/{users,expenses,income,sessions,balance-overrides,director-loan-overrides,uploads}
chmod -R 755 .storage/
```

---

## 📁 Project Structure

```
expense-tracker/
├── dist/                    # Built files (created by pnpm build)
│   ├── server/             # Compiled server code
│   │   ├── server.js       # Entry point
│   │   ├── index.js        # App definition
│   │   ├── routes/         # API routes
│   │   └── rpc/            # RPC handlers
│   └── client/
│       └── static/         # Client bundle
│           ├── main.js     # React app
│           └── main.css    # Styles
├── .storage/               # Persistent data (git-ignored)
│   ├── users/
│   ├── expenses/
│   ├── income/
│   ├── sessions/
│   ├── uploads/            # Receipt files
│   └── *-overrides/        # Balance overrides
├── logs/                   # PM2 logs
│   ├── pm2-error.log
│   └── pm2-out.log
├── src/                    # Source code (not needed on server)
├── ecosystem.config.cjs    # PM2 configuration
├── package.json
├── pnpm-lock.yaml
└── nginx.conf              # Nginx template
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (UFW)
- [ ] Set proper file permissions
- [ ] Regular backups enabled
- [ ] Update Node.js and dependencies regularly
- [ ] Monitor PM2 logs for errors
- [ ] Restrict SSH access (disable root login)
- [ ] Use strong passwords for all users

---

## 🌐 Environment Variables

Create `.env.production` in the app directory (optional):

```env
NODE_ENV=production
PORT=3000
```

Load in PM2 by updating `ecosystem.config.cjs`:
```javascript
env: {
  NODE_ENV: "production",
  PORT: 3000,
},
env_file: ".env.production",  // Add this line
```

---

## 📈 Monitoring

### Check App Health
```bash
# PM2 status
pm2 status

# Resource usage
pm2 monit

# Process info
pm2 info expense-tracker

# System resources
htop
```

### Check Logs
```bash
# Real-time logs
pm2 logs expense-tracker --lines 50

# Log files
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🎯 Production Checklist

Before going live:

1. ✅ Build completed successfully (`pnpm build`)
2. ✅ PM2 shows app as "online"
3. ✅ `curl localhost:3000` returns HTML
4. ✅ Nginx configured and tested (`sudo nginx -t`)
5. ✅ Domain resolves to server IP
6. ✅ SSL certificate installed
7. ✅ Firewall configured
8. ✅ Backup cron job setup
9. ✅ Default password changed
10. ✅ Test login, income, expense, and balances features

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Build | `pnpm build` |
| Start | `pm2 start ecosystem.config.cjs` |
| Stop | `pm2 stop expense-tracker` |
| Restart | `pm2 restart expense-tracker` |
| Logs | `pm2 logs expense-tracker` |
| Status | `pm2 status` |
| Backup | `tar -czf backup.tar.gz .storage/` |
| Update | `git pull && pnpm install && pnpm build && pm2 restart expense-tracker` |

**App URL**: http://your-domain.com  
**Default Credentials**: admin / admin  
**Port**: 3000 (Node.js) → 80/443 (Nginx)
