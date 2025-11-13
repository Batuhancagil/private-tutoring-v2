#!/bin/bash

# Database setup script for Railway
# Run this after deployment: railway run bash scripts/setup-db.sh

echo "🚀 Setting up database..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npm run db:generate

# Push schema to database
echo "🗄️  Pushing schema to database..."
npm run db:push

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Create a Superadmin user (via API or database)"
echo "2. Start implementing features from epics.md"

