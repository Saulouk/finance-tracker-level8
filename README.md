# Expense Tracker Application

A full-stack expense and income tracking application built with React, TypeScript, and Hono.

## Features

- ✅ User authentication with admin roles
- 💰 Income tracking with multiple payment methods
- 💳 Expense tracking with receipt uploads
- 📊 Automatic balance calculations
- 📈 Director's loan tracking
- 📁 CSV import/export
- 🌓 Dark mode support
- 🔍 Advanced filtering and date range queries
- 📱 Mobile-friendly responsive design

## Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Access at http://localhost:3000
```

**Default credentials:** `admin` / `admin`

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Debian 12

```bash
# 1. Build the application
pnpm build

# 2. Upload to server
scp -r dist/ package.json pnpm-lock.yaml ecosystem.config.cjs user@server:/var/www/expense-tracker/

# 3. On server
cd /var/www/expense-tracker
pnpm install --prod
mkdir -p .storage/uploads logs
pm2 start ecosystem.config.cjs
```

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS 4
- React Router
- TanStack Query

**Backend:**
- Hono (Node.js framework)
- oRPC (type-safe RPC)
- Unstorage (key-value storage)
- bcrypt (password hashing)

**Deployment:**
- PM2 (process manager)
- Nginx (reverse proxy)
- Node.js 20+

## Project Structure

```
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   └── app.tsx      # Main app
│   └── server/          # Backend API
│       ├── routes/      # HTTP routes
│       ├── rpc/         # RPC handlers
│       └── lib/         # Utilities
├── dist/               # Built files (after build)
├── .storage/           # Persistent data
└── ecosystem.config.cjs # PM2 configuration
```

## Key Files

- `DEPLOYMENT.md` - Complete deployment guide
- `ecosystem.config.cjs` - PM2 configuration
- `nginx.conf` - Nginx configuration template
- `tsconfig.server.json` - Server TypeScript config
- `vite.config.ts` - Vite build configuration

## Development

```bash
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Run production build locally
pnpm lint             # Run linter
```

## License

Private - Internal Use Only
