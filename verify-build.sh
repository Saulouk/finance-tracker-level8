#!/bin/bash

echo "==================================="
echo "Pre-Deployment Checklist"
echo "==================================="
echo ""

# Check if dist folder exists
if [ -d "dist/server" ] && [ -d "dist/client" ]; then
    echo "✓ Build artifacts exist"
else
    echo "✗ Build artifacts missing - run 'pnpm build'"
    exit 1
fi

# Check if server entry point exists
if [ -f "dist/server/server.js" ]; then
    echo "✓ Server entry point exists"
else
    echo "✗ Server entry point missing"
    exit 1
fi

# Check if client bundle exists
if [ -f "dist/client/static/main.js" ]; then
    echo "✓ Client bundle exists"
else
    echo "✗ Client bundle missing"
    exit 1
fi

# Check if PM2 config exists
if [ -f "ecosystem.config.cjs" ]; then
    echo "✓ PM2 config exists"
else
    echo "✗ PM2 config missing"
    exit 1
fi

# Check if package.json has module-alias
if grep -q "module-alias" package.json; then
    echo "✓ Module alias configured"
else
    echo "✗ Module alias not configured"
    exit 1
fi

echo ""
echo "==================================="
echo "Files ready for deployment:"
echo "==================================="
echo "- dist/"
echo "- package.json"
echo "- pnpm-lock.yaml"
echo "- ecosystem.config.cjs"
echo "- nginx.conf (template)"
echo ""
echo "Next steps:"
echo "1. Upload these files to your server"
echo "2. Run 'pnpm install --prod' on server"
echo "3. Create .storage/ and logs/ directories"
echo "4. Start with 'pm2 start ecosystem.config.cjs'"
echo "5. Configure Nginx using nginx.conf template"
echo ""
echo "See DEPLOYMENT.md for detailed instructions"
