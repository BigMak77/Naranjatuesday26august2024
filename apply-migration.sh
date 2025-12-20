#!/bin/bash

echo "📄 Applying migration: 20251219_auto_complete_training_on_test_pass.sql"
echo ""
echo "This migration will:"
echo "  • Create a trigger to auto-complete training when users pass tests"
echo "  • Backfill existing completed training from passed tests"
echo ""

# Apply just the new migration by copying it temporarily
cat supabase/migrations/20251219_auto_complete_training_on_test_pass.sql | \
  npx supabase db execute --stdin 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "The training dashboard should now update automatically when users pass tests."
else
  echo ""
  echo "⚠️  Migration may have encountered issues. Check the output above."
fi
