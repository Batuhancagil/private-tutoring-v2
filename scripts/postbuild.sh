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
echo "📦 Executing: npx prisma migrate deploy"
npx prisma migrate deploy

MIGRATION_EXIT_CODE=$?

if [ $MIGRATION_EXIT_CODE -ne 0 ]; then
    echo "❌ ERROR: Migration failed with exit code $MIGRATION_EXIT_CODE"
    echo "📋 Migration logs above should show the specific error"
    echo "💡 Common issues:"
    echo "   - Schema mismatch (schema.prisma doesn't match database)"
    echo "   - Missing migration files"
    echo "   - Database connection issues"
    echo "   - Migration conflicts"
    exit $MIGRATION_EXIT_CODE
fi

echo "✅ Migrations completed successfully"










