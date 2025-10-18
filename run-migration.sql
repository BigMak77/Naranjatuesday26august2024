-- Add permissions column to users table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql

-- Add the permissions column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'permissions'
  ) THEN
    ALTER TABLE users ADD COLUMN permissions TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added permissions column to users table';
  ELSE
    RAISE NOTICE 'Permissions column already exists';
  END IF;
END $$;

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN(permissions);

-- Add comment explaining the column
COMMENT ON COLUMN users.permissions IS 'Array of permission keys that the user has been granted (e.g., admin:manage-users, training:view)';

-- Verify the column was added
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'permissions';
