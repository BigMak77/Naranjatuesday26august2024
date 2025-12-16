-- Add location column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN users.location IS 'User''s selected location (England, Wales, Poland, or Group)';
