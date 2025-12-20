#!/bin/bash

echo "================================================================"
echo "APPLYING TEST INFRASTRUCTURE FIX"
echo "================================================================"
echo ""
echo "This will:"
echo "  1. Create test infrastructure tables (if they don't exist)"
echo "  2. Add trigger to auto-complete training when tests are passed"
echo ""

# Create a combined SQL file
cat > /tmp/test_fix_combined.sql << 'EOSQL'
-- First, create the test infrastructure
\i supabase/migrations/20251219090000_create_test_infrastructure.sql

-- Then, add the auto-completion trigger
\i supabase/migrations/20251219100000_auto_complete_training_on_test_pass.sql
EOSQL

echo "📝 SQL files combined"
echo ""
echo "To apply this fix, you have two options:"
echo ""
echo "Option 1: Copy and paste the SQL into Supabase SQL Editor"
echo "  1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new"
echo "  2. Copy the contents of BOTH files below and paste into the editor:"
echo "     - supabase/migrations/20251219090000_create_test_infrastructure.sql"
echo "     - supabase/migrations/20251219100000_auto_complete_training_on_test_pass.sql"
echo "  3. Click 'Run'"
echo ""
echo "Option 2: Use psql (if you have database connection string)"
echo "  cat supabase/migrations/20251219090000_create_test_infrastructure.sql \\"
echo "      supabase/migrations/20251219100000_auto_complete_training_on_test_pass.sql | \\"
echo "  psql 'your-connection-string'"
echo ""
echo "================================================================"
echo ""

# Print the first file for reference
echo "📄 File 1: create_test_infrastructure.sql (first 30 lines)"
echo "---"
head -30 supabase/migrations/20251219090000_create_test_infrastructure.sql
echo "... (file continues)"
echo ""
