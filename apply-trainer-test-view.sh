#!/bin/bash
set -e

echo "Applying trainer test view permissions migration..."

SUPABASE_DB_URL="postgresql://postgres.gkpkpwppzrztmgdltdwf:Mackenzi3@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

psql "$SUPABASE_DB_URL" -f supabase/migrations/20251221120000_allow_trainers_view_test_attempts.sql

echo "✅ Migration applied successfully!"
