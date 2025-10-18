-- Add permissions column to users table
-- This allows storing an array of permission keys for each user

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
  END IF;
END $$;

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN(permissions);

-- Add comment explaining the column
COMMENT ON COLUMN users.permissions IS 'Array of permission keys that the user has been granted (e.g., admin:manage-users, training:view)';
