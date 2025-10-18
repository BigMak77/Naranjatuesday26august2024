-- ============================================
-- Convert permissions column from TEXT to TEXT[]
-- ============================================
-- This converts your existing TEXT column to an array format
-- Run this in Supabase SQL Editor if you want array format

-- Step 1: Convert TEXT to TEXT[] properly handling empty strings
ALTER TABLE users ALTER COLUMN permissions TYPE TEXT[] USING
  CASE
    WHEN permissions IS NULL THEN NULL
    WHEN permissions = '' THEN NULL
    WHEN permissions LIKE '%,%' THEN string_to_array(permissions, ',')
    ELSE ARRAY[permissions]
  END;

-- Step 2: Set default for NULL values
UPDATE users SET permissions = '{}' WHERE permissions IS NULL;

-- Step 3: Make the column default to empty array
ALTER TABLE users ALTER COLUMN permissions SET DEFAULT '{}';

-- Step 4: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN(permissions);

-- Step 5: Verify it worked
SELECT
  id,
  first_name,
  last_name,
  permissions,
  pg_typeof(permissions) as column_type
FROM users
LIMIT 5;
