-- ============================================
-- Add permissions column to users table
-- ============================================
-- Copy this entire SQL and run it in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new

-- Step 1: Add the permissions column
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Step 2: Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN(permissions);

-- Step 3: Verify it worked
SELECT
  'Success! Permissions column added to users table' as status,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'permissions';
