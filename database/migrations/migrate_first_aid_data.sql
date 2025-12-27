-- =====================================================
-- FIRST AID DATA MIGRATION
-- =====================================================
-- Purpose: One-time migration to consolidate first aid data
--          from the dual-system (is_first_aid flag + module assignments)
--          into a single unified system
-- Created: 2025-12-27
-- Run Order: Run AFTER sync_first_aid_flag.sql
-- =====================================================

-- First Aid Module ID
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'First Aid Data Migration Started';
  RAISE NOTICE 'Module ID: f1236b6b-ee01-4e68-9082-e2380b0fa600';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- STEP 1: AUDIT CURRENT STATE
-- =====================================================

DO $$
DECLARE
  users_with_flag INTEGER;
  users_with_assignment INTEGER;
  users_with_both INTEGER;
  users_with_only_flag INTEGER;
  users_with_only_assignment INTEGER;
BEGIN
  -- Count users with is_first_aid flag
  SELECT COUNT(*) INTO users_with_flag
  FROM users
  WHERE is_first_aid = true AND auth_id IS NOT NULL;

  -- Count users with first aid module assignment
  SELECT COUNT(DISTINCT auth_id) INTO users_with_assignment
  FROM user_assignments
  WHERE item_type = 'module'
    AND item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600';

  -- Count users with BOTH
  SELECT COUNT(*) INTO users_with_both
  FROM users u
  WHERE u.is_first_aid = true
    AND u.auth_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    );

  -- Count users with ONLY flag (no assignment)
  SELECT COUNT(*) INTO users_with_only_flag
  FROM users u
  WHERE u.is_first_aid = true
    AND u.auth_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    );

  -- Count users with ONLY assignment (no flag)
  SELECT COUNT(DISTINCT ua.auth_id) INTO users_with_only_assignment
  FROM user_assignments ua
  WHERE ua.item_type = 'module'
    AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = ua.auth_id
        AND u.is_first_aid = true
    );

  RAISE NOTICE '--- CURRENT STATE ---';
  RAISE NOTICE 'Users with is_first_aid flag: %', users_with_flag;
  RAISE NOTICE 'Users with module assignment: %', users_with_assignment;
  RAISE NOTICE 'Users with BOTH (synchronized): %', users_with_both;
  RAISE NOTICE 'Users with ONLY flag (need assignment): %', users_with_only_flag;
  RAISE NOTICE 'Users with ONLY assignment (need flag): %', users_with_only_assignment;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 2: MIGRATE FLAG-ONLY USERS TO ASSIGNMENTS
-- =====================================================

-- Create assignments for users who have is_first_aid=true but no assignment
INSERT INTO user_assignments (
  auth_id,
  item_id,
  item_type,
  assigned_at,
  completed_at
)
SELECT
  u.auth_id,
  'f1236b6b-ee01-4e68-9082-e2380b0fa600'::uuid AS item_id,
  'module' AS item_type,
  NOW() AS assigned_at,
  NOW() AS completed_at  -- Mark as completed since they're already designated
FROM users u
WHERE u.is_first_aid = true
  AND u.auth_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_assignments ua
    WHERE ua.auth_id = u.auth_id
      AND ua.item_type = 'module'
      AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
  )
ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;

DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE '--- MIGRATION: FLAG → ASSIGNMENT ---';
  RAISE NOTICE 'Created % new first aid module assignments', migrated_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 3: SYNC ASSIGNMENT-ONLY USERS TO FLAG
-- =====================================================

-- Update flag for users who have assignment but is_first_aid=false
UPDATE users
SET is_first_aid = true
WHERE auth_id IN (
  SELECT ua.auth_id
  FROM user_assignments ua
  WHERE ua.item_type = 'module'
    AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
)
AND (is_first_aid = false OR is_first_aid IS NULL);

DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RAISE NOTICE '--- SYNCHRONIZATION: ASSIGNMENT → FLAG ---';
  RAISE NOTICE 'Updated % users to set is_first_aid = true', synced_count;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 4: VERIFY MIGRATION RESULTS
-- =====================================================

DO $$
DECLARE
  users_with_flag_after INTEGER;
  users_with_assignment_after INTEGER;
  users_with_both_after INTEGER;
  users_with_only_flag_after INTEGER;
  users_with_only_assignment_after INTEGER;
BEGIN
  -- Re-count after migration
  SELECT COUNT(*) INTO users_with_flag_after
  FROM users
  WHERE is_first_aid = true AND auth_id IS NOT NULL;

  SELECT COUNT(DISTINCT auth_id) INTO users_with_assignment_after
  FROM user_assignments
  WHERE item_type = 'module'
    AND item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600';

  SELECT COUNT(*) INTO users_with_both_after
  FROM users u
  WHERE u.is_first_aid = true
    AND u.auth_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    );

  SELECT COUNT(*) INTO users_with_only_flag_after
  FROM users u
  WHERE u.is_first_aid = true
    AND u.auth_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM user_assignments ua
      WHERE ua.auth_id = u.auth_id
        AND ua.item_type = 'module'
        AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    );

  SELECT COUNT(DISTINCT ua.auth_id) INTO users_with_only_assignment_after
  FROM user_assignments ua
  WHERE ua.item_type = 'module'
    AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
    AND NOT EXISTS (
      SELECT 1 FROM users u
      WHERE u.auth_id = ua.auth_id
        AND u.is_first_aid = true
    );

  RAISE NOTICE '--- VERIFICATION (AFTER MIGRATION) ---';
  RAISE NOTICE 'Users with is_first_aid flag: %', users_with_flag_after;
  RAISE NOTICE 'Users with module assignment: %', users_with_assignment_after;
  RAISE NOTICE 'Users with BOTH (synchronized): %', users_with_both_after;
  RAISE NOTICE 'Users with ONLY flag: % (should be 0)', users_with_only_flag_after;
  RAISE NOTICE 'Users with ONLY assignment: % (should be 0)', users_with_only_assignment_after;
  RAISE NOTICE '';

  IF users_with_only_flag_after > 0 THEN
    RAISE WARNING 'Still have % users with only flag - check for users without auth_id', users_with_only_flag_after;
  END IF;

  IF users_with_only_assignment_after > 0 THEN
    RAISE WARNING 'Still have % users with only assignment - this should not happen', users_with_only_assignment_after;
  END IF;

  IF users_with_both_after = users_with_flag_after AND users_with_both_after = users_with_assignment_after THEN
    RAISE NOTICE '✓ SUCCESS: All first aiders are now synchronized!';
  ELSE
    RAISE WARNING '⚠ PARTIAL SUCCESS: Some inconsistencies remain - review warnings above';
  END IF;
END $$;

-- =====================================================
-- STEP 5: LIST ANY USERS WITHOUT auth_id
-- =====================================================

DO $$
DECLARE
  users_without_auth INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_without_auth
  FROM users
  WHERE is_first_aid = true AND auth_id IS NULL;

  IF users_without_auth > 0 THEN
    RAISE WARNING '--- USERS WITHOUT auth_id ---';
    RAISE WARNING '% users have is_first_aid=true but no auth_id', users_without_auth;
    RAISE WARNING 'These users cannot be synchronized until they have an auth_id';
    RAISE WARNING 'Run this query to see them:';
    RAISE WARNING 'SELECT id, first_name, last_name, email FROM users WHERE is_first_aid=true AND auth_id IS NULL;';
  END IF;
END $$;

-- =====================================================
-- COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'First Aid Data Migration Completed';
  RAISE NOTICE 'From now on, the trigger will keep data synchronized';
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- OPTIONAL: VIEW CURRENT FIRST AIDERS
-- =====================================================

-- Uncomment to see all current first aiders:

/*
SELECT
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.employee_number,
  u.is_first_aid,
  ua.assigned_at,
  ua.completed_at,
  CASE
    WHEN ua.completed_at IS NOT NULL THEN 'Completed'
    WHEN ua.assigned_at IS NOT NULL THEN 'In Progress'
    ELSE 'Not Started'
  END AS training_status
FROM users u
LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
  AND ua.item_type = 'module'
  AND ua.item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
WHERE u.is_first_aid = true
ORDER BY u.last_name, u.first_name;
*/

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================

/*
If you need to rollback this migration:

-- 1. Disable the trigger first:
ALTER TABLE user_assignments DISABLE TRIGGER sync_first_aid_trigger;

-- 2. Delete assignments created by this migration:
DELETE FROM user_assignments
WHERE item_type = 'module'
  AND item_id = 'f1236b6b-ee01-4e68-9082-e2380b0fa600'
  AND assigned_at >= '2025-12-27'  -- Adjust date as needed
  AND completed_at >= '2025-12-27';

-- 3. Reset flags if needed:
UPDATE users SET is_first_aid = false WHERE is_first_aid = true;

-- 4. Re-enable trigger:
ALTER TABLE user_assignments ENABLE TRIGGER sync_first_aid_trigger;
*/
