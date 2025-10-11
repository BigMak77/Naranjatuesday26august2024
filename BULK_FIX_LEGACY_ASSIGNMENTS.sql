-- BULK FIX FOR ALL USERS WITH LEGACY ASSIGNMENTS
-- This will clean up all users who moved roles but kept old assignments

-- Step 1: Identify users with assignment mismatches
WITH user_assignment_counts AS (
  SELECT 
    u.id as user_id,
    u.auth_id,
    u.role_id,
    COUNT(ua.auth_id) as current_assignments
  FROM users u
  LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
  WHERE u.role_id IS NOT NULL
  GROUP BY u.id, u.auth_id, u.role_id
),
role_assignment_counts AS (
  SELECT 
    role_id,
    COUNT(*) as expected_assignments
  FROM role_assignments 
  GROUP BY role_id
),
mismatched_users AS (
  SELECT 
    uac.user_id,
    uac.auth_id,
    uac.role_id,
    uac.current_assignments,
    rac.expected_assignments,
    (uac.current_assignments - rac.expected_assignments) as mismatch
  FROM user_assignment_counts uac
  JOIN role_assignment_counts rac ON uac.role_id = rac.role_id
  WHERE uac.current_assignments != rac.expected_assignments
)
SELECT 
  'USERS WITH LEGACY ASSIGNMENTS' as status,
  user_id,
  role_id,
  current_assignments,
  expected_assignments,
  mismatch,
  CASE 
    WHEN mismatch > 0 THEN 'TOO MANY (legacy assignments)'
    ELSE 'TOO FEW (missing assignments)'
  END as issue_type
FROM mismatched_users
ORDER BY mismatch DESC;

-- Step 2: BULK FIX TRANSACTION
-- WARNING: This will delete and recreate assignments for ALL users with mismatches

BEGIN;

-- Create a temporary table to track the fix
CREATE TEMP TABLE bulk_fix_log (
  user_id UUID,
  auth_id TEXT,
  role_id UUID,
  assignments_before INT,
  assignments_after INT,
  fixed_at TIMESTAMP DEFAULT NOW()
);

-- Fix each user with mismatched assignments
WITH user_assignment_counts AS (
  SELECT 
    u.id as user_id,
    u.auth_id,
    u.role_id,
    COUNT(ua.auth_id) as current_assignments
  FROM users u
  LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
  WHERE u.role_id IS NOT NULL
  GROUP BY u.id, u.auth_id, u.role_id
),
role_assignment_counts AS (
  SELECT 
    role_id,
    COUNT(*) as expected_assignments
  FROM role_assignments 
  GROUP BY role_id
),
mismatched_users AS (
  SELECT 
    uac.user_id,
    uac.auth_id,
    uac.role_id,
    uac.current_assignments,
    rac.expected_assignments
  FROM user_assignment_counts uac
  JOIN role_assignment_counts rac ON uac.role_id = rac.role_id
  WHERE uac.current_assignments != rac.expected_assignments
)
INSERT INTO bulk_fix_log (user_id, auth_id, role_id, assignments_before)
SELECT user_id, auth_id, role_id, current_assignments
FROM mismatched_users;

-- Delete ALL assignments for users with mismatches
DELETE FROM user_assignments 
WHERE auth_id IN (
  SELECT DISTINCT bfl.auth_id FROM bulk_fix_log bfl
);

-- Insert correct assignments for each user based on their current role
INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
SELECT 
  bfl.auth_id,
  COALESCE(ra.document_id, ra.module_id) as item_id,
  ra.type as item_type,
  NOW()
FROM bulk_fix_log bfl
JOIN role_assignments ra ON bfl.role_id = ra.role_id;

-- Update the log with final counts
UPDATE bulk_fix_log 
SET assignments_after = (
  SELECT COUNT(*) 
  FROM user_assignments ua 
  WHERE ua.auth_id = bulk_fix_log.auth_id
);

-- Show the results
SELECT 
  'BULK FIX RESULTS' as status,
  COUNT(*) as users_fixed,
  SUM(assignments_before) as total_assignments_removed,
  SUM(assignments_after) as total_assignments_added,
  SUM(assignments_after - assignments_before) as net_change
FROM bulk_fix_log;

-- Show details for each fixed user
SELECT 
  'INDIVIDUAL RESULTS' as status,
  user_id,
  role_id,
  assignments_before,
  assignments_after,
  (assignments_after - assignments_before) as change,
  CASE 
    WHEN assignments_after > assignments_before THEN 'ADDED ASSIGNMENTS'
    WHEN assignments_after < assignments_before THEN 'REMOVED LEGACY'
    ELSE 'NO CHANGE'
  END as action_taken
FROM bulk_fix_log
ORDER BY change DESC;

-- Log the bulk fix in audit trail
INSERT INTO audit_log (table_name, operation, user_id, new_values, timestamp)
SELECT 
  'user_assignments',
  'bulk_legacy_cleanup',
  user_id,
  jsonb_build_object(
    'assignments_before', assignments_before,
    'assignments_after', assignments_after,
    'net_change', assignments_after - assignments_before
  ),
  NOW()
FROM bulk_fix_log;

COMMIT;

-- Final verification - should show no mismatched users
WITH user_assignment_counts AS (
  SELECT 
    u.id as user_id,
    u.role_id,
    COUNT(ua.auth_id) as current_assignments
  FROM users u
  LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
  WHERE u.role_id IS NOT NULL
  GROUP BY u.id, u.role_id
),
role_assignment_counts AS (
  SELECT 
    role_id,
    COUNT(*) as expected_assignments
  FROM role_assignments 
  GROUP BY role_id
)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '🎉 SUCCESS: All users now have correct assignments!'
    ELSE '❌ ERROR: Still have mismatched users'
  END as final_status,
  COUNT(*) as remaining_mismatches
FROM user_assignment_counts uac
JOIN role_assignment_counts rac ON uac.role_id = rac.role_id
WHERE uac.current_assignments != rac.expected_assignments;

-- Clean up temp table
DROP TABLE bulk_fix_log;
