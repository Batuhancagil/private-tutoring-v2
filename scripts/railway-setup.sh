#!/bin/bash

# Railway Database Setup Script
# Run this via: railway run bash scripts/railway-setup.sh

echo "🚀 Setting up database on Railway..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    echo "Please set DATABASE_URL in Railway environment variables"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma Client"
    exit 1
fi

# Push schema to database
echo "🗄️  Pushing schema to database..."
npm run db:push

if [ $? -ne 0 ]; then
    echo "❌ Failed to push schema to database"
    echo "Check your DATABASE_URL and database connection"
    exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Railway app URL"
echo "2. Check /api/health endpoint"
echo "3. Start implementing features from epics.md"

