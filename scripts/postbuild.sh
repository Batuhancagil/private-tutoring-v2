#!/bin/bash

# Railway Post-Build Script
# This runs migrations after build completes

echo "🔄 Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  WARNING: DATABASE_URL is not set, skipping migrations"
    exit 0
fi

# Run migrations
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "⚠️  WARNING: Migration failed, but continuing deployment"
    exit 0
fi

echo "✅ Migrations completed successfully"

