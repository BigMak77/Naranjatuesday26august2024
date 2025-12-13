#!/bin/bash

# Script to apply the auto auth_id trigger to Supabase

set -e

echo "🔧 Applying Auto auth_id Trigger"
echo "================================="
echo ""

# Check if migration file exists
if [ ! -f "supabase/migrations/20251213_auto_set_auth_id.sql" ]; then
    echo "❌ Error: Migration file not found!"
    exit 1
fi

echo "📋 This will:"
echo "  1. Create a database trigger to auto-set auth_id = id"
echo "  2. Ensure future users automatically get auth_id"
echo "  3. Allow module inheritance to work immediately"
echo ""
echo "⚠️  Please apply this migration via Supabase Dashboard SQL Editor"
echo ""
echo "Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new"
echo "2. Copy the SQL from: supabase/migrations/20251213_auto_set_auth_id.sql"
echo "3. Paste it into the SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "SQL to run:"
echo "─────────────────────────────────────────────────────────────────"
cat supabase/migrations/20251213_auto_set_auth_id.sql
echo ""
echo "─────────────────────────────────────────────────────────────────"
echo ""
echo "After applying, new users will automatically receive:"
echo "  ✅ auth_id = their user id"
echo "  ✅ Immediate module inheritance"
echo "  ✅ Automatic training assignments"
echo ""
