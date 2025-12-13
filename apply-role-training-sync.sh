#!/bin/bash
# Script to apply the role training sync migration directly

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not found in environment"
  echo "Please run this migration manually in your Supabase SQL Editor:"
  echo ""
  cat supabase/migrations/20251213_auto_sync_role_training.sql
  exit 1
fi

# Apply the migration
echo "Applying role training sync migration..."
psql "$DATABASE_URL" -f supabase/migrations/20251213_auto_sync_role_training.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration applied successfully!"
else
  echo "❌ Migration failed. Please apply manually in Supabase SQL Editor."
fi
