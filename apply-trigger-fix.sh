#!/bin/bash

# Script to apply the department trigger fix to Supabase
# This fixes automatic module inheritance when users change departments

set -e

echo "🔧 Applying Department Trigger Fix"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251213_fix_department_training_sync.sql" ]; then
    echo "❌ Error: Migration file not found!"
    echo "   Make sure you're running this from the project root"
    exit 1
fi

echo "📋 This will:"
echo "  1. Update the department training sync trigger"
echo "  2. Make it check user's direct department_id first"
echo "  3. Trigger on both department_id AND role_id changes"
echo ""
echo "⚠️  This requires Supabase CLI to be linked to your project"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Applying migration..."
echo ""

# Try to apply via Supabase CLI
if command -v npx &> /dev/null; then
    cat supabase/migrations/20251213_fix_department_training_sync.sql | \
        npx supabase db execute --db-url "$DATABASE_URL" 2>&1 || {
        echo ""
        echo "⚠️  Supabase CLI method failed. Trying alternative..."
        echo ""

        # Alternative: Show instructions for manual application
        echo "Please apply the migration manually:"
        echo ""
        echo "1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new"
        echo "2. Copy the SQL from: supabase/migrations/20251213_fix_department_training_sync.sql"
        echo "3. Paste it into the SQL Editor"
        echo "4. Click 'Run'"
        echo ""
        echo "Then run this to verify:"
        echo "  npx tsx scripts/find-missed-users.ts"
        echo ""
        exit 1
    }
else
    echo "❌ npx not found. Please install Node.js"
    exit 1
fi

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "To verify the fix worked, run:"
echo "  npx tsx scripts/find-missed-users.ts"
echo ""
echo "The department trigger now:"
echo "  ✅ Uses user's direct department_id"
echo "  ✅ Triggers on department_id changes"
echo "  ✅ Triggers on role_id changes"
echo "  ✅ Auto-syncs training when users move departments"
echo ""
