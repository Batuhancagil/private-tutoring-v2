#!/bin/bash

# Verify Railway Deployment
# Run via: railway run bash scripts/verify-deployment.sh

echo "🔍 Verifying Railway deployment..."

# Check environment variables
echo ""
echo "📋 Environment Variables:"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
else
    echo "✅ DATABASE_URL is set"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET is not set"
else
    echo "✅ JWT_SECRET is set"
fi

if [ -z "$NODE_ENV" ]; then
    echo "⚠️  NODE_ENV is not set (defaults to development)"
else
    echo "✅ NODE_ENV is set to: $NODE_ENV"
fi

# Check Prisma Client
echo ""
echo "📦 Checking Prisma Client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client is generated"
else
    echo "⚠️  Prisma Client not found, generating..."
    npm run db:generate
fi

# Test database connection
echo ""
echo "🗄️  Testing database connection..."
npm run db:push -- --skip-generate 2>&1 | head -20

echo ""
echo "✅ Verification complete!"
echo ""
echo "Next: Visit your Railway app URL and check /api/health endpoint"

