-- Simple migration script to preserve existing training completion data
-- Copy and paste this into Supabase SQL Editor

-- Migrate existing completion data from user_assignments to the new permanent table
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

-- Verify the migration by item type
SELECT 
  item_type,
  COUNT(*) as completion_count,
  COUNT(DISTINCT auth_id) as unique_users
FROM user_training_completions
GROUP BY item_type
ORDER BY item_type;

-- Show recent completions as a sample
SELECT 
  utc.auth_id,
  u.first_name || ' ' || u.last_name as user_name,
  utc.item_type,
  utc.item_id,
  utc.completed_at::date as completion_date,
  r.title as completed_by_role
FROM user_training_completions utc
JOIN users u ON u.auth_id = utc.auth_id
LEFT JOIN roles r ON r.id = utc.completed_by_role_id
ORDER BY utc.completed_at DESC
LIMIT 10;
