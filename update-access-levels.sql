-- =========================================
-- Update Access Levels Migration
-- =========================================
-- This migration updates the users table to support the new access level hierarchy
-- and adds proper constraints to ensure data integrity.
--
-- New Access Levels:
-- - Super Admin (highest level - full system access)
-- - Admin (system administration)
-- - HR Admin (employee management across all departments)
-- - H&S Admin (health & safety across all departments)
-- - Dept. Manager (department-wide management, all shifts)
-- - Manager (shift-level management)
-- - Trainer (training management across assigned departments)
-- - User (basic user access)
--
-- Run this migration with: psql [your-database-url] -f update-access-levels.sql
-- =========================================

-- Step 1: Check current structure
SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'access_level';

-- Step 2: If access_level is currently a numeric type or has constraints, we need to handle it
-- First, let's see if there are any existing constraints
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE cl.relname = 'users'
AND pg_get_constraintdef(c.oid) LIKE '%access_level%';

-- Step 3: Drop any existing CHECK constraints on access_level
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint c
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE cl.relname = 'users'
        AND pg_get_constraintdef(c.oid) LIKE '%access_level%'
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE users DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Step 4: Backup current access_level values
CREATE TABLE IF NOT EXISTS users_access_level_backup AS
SELECT id, access_level, first_name, last_name, email
FROM users;

SELECT 'Backed up ' || COUNT(*) || ' user records' AS backup_status
FROM users_access_level_backup;

-- Step 5: Update the column type to VARCHAR if it's not already
-- This handles the case where access_level might be a number or enum
ALTER TABLE users
ALTER COLUMN access_level TYPE VARCHAR(50);

-- Step 6: Update existing values to the new naming convention
-- This maps old values to new ones (adjust based on your current data)
UPDATE users SET access_level = 'Super Admin'
WHERE LOWER(access_level) IN ('super admin', 'superadmin', 'super_admin');

UPDATE users SET access_level = 'Admin'
WHERE LOWER(access_level) IN ('admin', 'administrator');

UPDATE users SET access_level = 'HR Admin'
WHERE LOWER(access_level) IN ('hr', 'hr admin', 'hr_admin', 'hradmin');

UPDATE users SET access_level = 'H&S Admin'
WHERE LOWER(access_level) IN ('h&s admin', 'h&s', 'hs admin', 'health and safety', 'health & safety admin');

UPDATE users SET access_level = 'Dept. Manager'
WHERE LOWER(access_level) IN ('dept. manager', 'dept manager', 'department manager', 'dept_manager');

UPDATE users SET access_level = 'Manager'
WHERE LOWER(access_level) IN ('manager', 'shift manager');

UPDATE users SET access_level = 'Trainer'
WHERE LOWER(access_level) IN ('trainer', 'training admin');

UPDATE users SET access_level = 'User'
WHERE LOWER(access_level) IN ('user', 'employee', 'standard user', 'basic');

-- Show any users with unrecognized access levels
SELECT id, first_name, last_name, email, access_level
FROM users
WHERE access_level NOT IN (
    'Super Admin', 'Admin', 'HR Admin', 'H&S Admin',
    'Dept. Manager', 'Manager', 'Trainer', 'User'
)
AND access_level IS NOT NULL;

-- Step 7: Add CHECK constraint to enforce valid access levels
ALTER TABLE users
ADD CONSTRAINT users_access_level_check
CHECK (access_level IN (
    'Super Admin',
    'Admin',
    'HR Admin',
    'H&S Admin',
    'Dept. Manager',
    'Manager',
    'Trainer',
    'User'
));

-- Step 8: Set default value for new users
ALTER TABLE users
ALTER COLUMN access_level SET DEFAULT 'User';

-- Step 9: Ensure access_level is not null (optional - uncomment if you want this)
-- ALTER TABLE users
-- ALTER COLUMN access_level SET NOT NULL;

-- Step 10: Verify the migration
SELECT
    access_level,
    COUNT(*) as user_count
FROM users
GROUP BY access_level
ORDER BY
    CASE access_level
        WHEN 'Super Admin' THEN 1
        WHEN 'Admin' THEN 2
        WHEN 'HR Admin' THEN 3
        WHEN 'H&S Admin' THEN 4
        WHEN 'Dept. Manager' THEN 5
        WHEN 'Manager' THEN 6
        WHEN 'Trainer' THEN 7
        WHEN 'User' THEN 8
        ELSE 9
    END;

-- Success message
SELECT '✅ Migration completed successfully!' AS status;
SELECT '📊 Review the access_level distribution above' AS next_step;
SELECT '💡 To rollback: DROP CONSTRAINT users_access_level_check; UPDATE users SET access_level = (SELECT access_level FROM users_access_level_backup WHERE users_access_level_backup.id = users.id);' AS rollback_command;
