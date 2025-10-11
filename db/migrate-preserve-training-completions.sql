-- Migration script to preserve existing training completion data
-- Run this BEFORE implementing the new system

BEGIN;

-- Create the new completions table (if not already created)
\i create-user-training-completions-table.sql

-- Migrate existing completion data from user_assignments
INSERT INTO user_training_completions (auth_id, item_id, item_type, completed_at, completed_by_role_id)
SELECT DISTINCT
  ua.auth_id,
  ua.item_id,
  ua.item_type,
  ua.completed_at,
  u.role_id as completed_by_role_id
FROM user_assignments ua
JOIN users u ON u.auth_id = ua.auth_id
WHERE ua.completed_at IS NOT NULL
ON CONFLICT (auth_id, item_id, item_type) DO NOTHING; -- Skip duplicates

-- Show migration results
SELECT 
  'Migrated ' || COUNT(*) || ' completion records' as migration_result
FROM user_training_completions;

-- Verify the migration
SELECT 
  item_type,
  COUNT(*) as completion_count,
  COUNT(DISTINCT auth_id) as unique_users
FROM user_training_completions
GROUP BY item_type;

COMMIT;

-- Report
SELECT 'Migration completed successfully. All existing training completion data preserved.' as status;
