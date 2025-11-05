#!/bin/bash

# Quick deployment script for Debian 12 server
# Run this ON THE SERVER after uploading files

echo "Setting up Expense Tracker..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please don't run as root. Use a regular user with sudo access."
    exit 1
fi

# Install dependencies
echo "Installing production dependencies..."
pnpm install --prod

# Create required directories
echo "Creating directories..."
mkdir -p .storage/uploads
mkdir -p logs

# Set permissions
echo "Setting permissions..."
chmod -R 755 .storage/

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found. Installing globally..."
    sudo npm install -g pm2
fi

# Start with PM2
echo "Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

echo ""
echo "✓ Application started successfully!"
echo ""
echo "Run these commands to complete setup:"
echo "  pm2 logs expense-tracker    # View logs"
echo "  pm2 status                  # Check status"
echo "  pm2 startup                 # Enable on boot"
echo ""
echo "Default login: admin / admin"
echo "⚠️  CHANGE PASSWORD IMMEDIATELY!"
