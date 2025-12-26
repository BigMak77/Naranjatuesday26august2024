-- ============================================================================
-- COMPREHENSIVE TRIGGER FIX - ONE SQL TO FIX ALL ISSUES
-- ============================================================================
-- Run this ONCE in your Supabase SQL Editor to fix all trigger issues
-- This script will:
-- 1. Fix the department trigger conflict (only fire on department_id changes)
-- 2. Investigate and report on the 3 role_assignments triggers
-- 3. Remove duplicate training logs
-- 4. Add unique constraint to prevent future duplicates
-- 5. Verify all fixes were applied correctly
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: FIX DEPARTMENT TRIGGER CONFLICT
-- ============================================================================
-- The department trigger should ONLY fire on department_id changes,
-- NOT on role_id changes (that's what the role trigger is for)

DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;

CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id ON users
FOR EACH ROW
WHEN (OLD.department_id IS DISTINCT FROM NEW.department_id)
EXECUTE FUNCTION sync_department_training_to_user();

COMMENT ON TRIGGER trigger_sync_department_training_on_update ON users IS
'Syncs department training when department_id changes. Does NOT trigger on role_id changes to avoid conflicts with role training trigger.';

-- ============================================================================
-- STEP 2: REMOVE DUPLICATE TRAINING LOGS
-- ============================================================================
-- Delete duplicate entries from training_logs table
-- Keeps only the first entry for each unique combination of (auth_id, topic, date)

DO $$
DECLARE
  v_deleted_count integer := 0;
BEGIN
  -- Use a CTE to identify duplicates and delete all but the first one
  WITH duplicates AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY auth_id, topic, date
        ORDER BY created_at ASC, id ASC
      ) as row_num
    FROM training_logs
  )
  DELETE FROM training_logs
  WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
  );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE '✓ Removed % duplicate training log entries', v_deleted_count;
END $$;

-- ============================================================================
-- STEP 3: ADD UNIQUE CONSTRAINT TO PREVENT FUTURE DUPLICATES
-- ============================================================================
-- This ensures only one training log entry per user per topic per date

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_logs_unique_user_topic_date
ON training_logs(auth_id, topic, date);

COMMENT ON INDEX idx_training_logs_unique_user_topic_date IS
'Ensures only one training log entry per user per topic per date';

-- ============================================================================
-- STEP 4: INVESTIGATE ROLE_ASSIGNMENTS TRIGGERS
-- ============================================================================
-- Check what the 3 triggers on role_assignments actually do

DO $$
DECLARE
  v_func_record RECORD;
  v_trigger_count INTEGER;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'INVESTIGATING ROLE_ASSIGNMENTS TRIGGERS';
  RAISE NOTICE '============================================================';

  -- Count triggers on role_assignments
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'role_assignments'
    AND NOT t.tgisinternal;

  RAISE NOTICE 'Found % triggers on role_assignments table', v_trigger_count;
  RAISE NOTICE '';

  -- Check each function to see if they're duplicates
  FOR v_func_record IN
    SELECT DISTINCT
      p.proname as function_name,
      CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%INSERT INTO user_assignments%' THEN 'Creates user_assignments'
        WHEN pg_get_functiondef(p.oid) LIKE '%NOTIFY%' OR pg_get_functiondef(p.oid) LIKE '%pg_notify%' THEN 'Sends notifications'
        ELSE 'Unknown purpose'
      END as purpose
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'role_assignments'
      AND NOT t.tgisinternal
    ORDER BY p.proname
  LOOP
    RAISE NOTICE '  Function: % - Purpose: %', v_func_record.function_name, v_func_record.purpose;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'NOTE: If you see multiple functions that "Create user_assignments",';
  RAISE NOTICE 'you may have duplicate triggers that should be removed.';
  RAISE NOTICE 'Review the output above and manually drop any duplicates.';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- STEP 5: CHECK FOR DUPLICATE ROLE_ASSIGNMENT FUNCTIONS
-- ============================================================================
-- If we find that sync_user_assignments_on_role_assignment and
-- sync_new_role_assignment_to_users do the same thing, we'll drop the duplicate

DO $$
DECLARE
  v_has_sync_user_assignments BOOLEAN;
  v_has_sync_new_role BOOLEAN;
  v_both_create_assignments BOOLEAN := FALSE;
BEGIN
  -- Check if both functions exist
  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'sync_user_assignments_on_role_assignment'
  ) INTO v_has_sync_user_assignments;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'sync_new_role_assignment_to_users'
  ) INTO v_has_sync_new_role;

  -- If both exist, check if they both create user_assignments
  IF v_has_sync_user_assignments AND v_has_sync_new_role THEN
    SELECT (
      (SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'sync_user_assignments_on_role_assignment')
      LIKE '%INSERT INTO user_assignments%'
    ) AND (
      (SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'sync_new_role_assignment_to_users')
      LIKE '%INSERT INTO user_assignments%'
    ) INTO v_both_create_assignments;

    IF v_both_create_assignments THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  WARNING: POTENTIAL DUPLICATE TRIGGERS DETECTED';
      RAISE NOTICE '============================================================';
      RAISE NOTICE 'Both sync_user_assignments_on_role_assignment AND';
      RAISE NOTICE 'sync_new_role_assignment_to_users create user_assignments.';
      RAISE NOTICE '';
      RAISE NOTICE 'This means when you add training to a role, it may be';
      RAISE NOTICE 'assigned to users TWICE by different triggers.';
      RAISE NOTICE '';
      RAISE NOTICE 'RECOMMENDED ACTION:';
      RAISE NOTICE '1. Keep: trigger_sync_new_role_assignment (newer, from migration)';
      RAISE NOTICE '2. Drop: sync_user_assignments_trigger (likely legacy)';
      RAISE NOTICE '';
      RAISE NOTICE 'To drop the legacy trigger, run:';
      RAISE NOTICE 'DROP TRIGGER IF EXISTS sync_user_assignments_trigger ON role_assignments;';
      RAISE NOTICE '============================================================';
    ELSE
      RAISE NOTICE '✓ No duplicate triggers detected - they serve different purposes';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 6: VERIFICATION QUERIES
-- ============================================================================
-- These queries verify that all fixes were applied correctly

DO $$
DECLARE
  v_trigger_def TEXT;
  v_total_triggers INTEGER;
  v_users_triggers INTEGER;
  v_role_assign_triggers INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '============================================================';

  -- Verify department trigger only fires on department_id
  SELECT pg_get_triggerdef(t.oid) INTO v_trigger_def
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'users'
    AND t.tgname = 'trigger_sync_department_training_on_update';

  IF v_trigger_def LIKE '%UPDATE OF department_id%' THEN
    RAISE NOTICE '✓ Department trigger correctly fires only on department_id changes';
  ELSE
    RAISE WARNING '✗ Department trigger still has incorrect configuration!';
    RAISE NOTICE 'Current definition: %', v_trigger_def;
  END IF;

  -- Verify unique constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_training_logs_unique_user_topic_date'
  ) THEN
    RAISE NOTICE '✓ Unique constraint on training_logs exists';
  ELSE
    RAISE WARNING '✗ Unique constraint was not created!';
  END IF;

  -- Show final trigger counts
  SELECT COUNT(*) INTO v_total_triggers
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE NOT t.tgisinternal AND n.nspname = 'public';

  SELECT COUNT(*) INTO v_users_triggers
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'users' AND NOT t.tgisinternal;

  SELECT COUNT(*) INTO v_role_assign_triggers
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'role_assignments' AND NOT t.tgisinternal;

  RAISE NOTICE '';
  RAISE NOTICE 'Total triggers in database: %', v_total_triggers;
  RAISE NOTICE 'Triggers on users table: %', v_users_triggers;
  RAISE NOTICE 'Triggers on role_assignments table: %', v_role_assign_triggers;
  IF v_role_assign_triggers > 2 THEN
    RAISE NOTICE '  ⚠️  You have % triggers on role_assignments (expected: 1-2)', v_role_assign_triggers;
    RAISE NOTICE '  Review the investigation results above to identify duplicates.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'SUMMARY';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '✓ Department trigger conflict fixed';
  RAISE NOTICE '✓ Duplicate training logs removed';
  RAISE NOTICE '✓ Unique constraint added to training_logs';
  RAISE NOTICE '✓ Role_assignments triggers investigated';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Review the role_assignments trigger investigation above';
  RAISE NOTICE '2. If duplicates found, drop the legacy trigger manually';
  RAISE NOTICE '3. Test by updating a user''s role and checking for duplicates';
  RAISE NOTICE '============================================================';
END $$;

COMMIT;

-- ============================================================================
-- OPTIONAL: DROP LEGACY TRIGGER (UNCOMMENT IF NEEDED)
-- ============================================================================
-- Based on the investigation, if you confirm there's a duplicate, uncomment this:

-- DROP TRIGGER IF EXISTS sync_user_assignments_trigger ON role_assignments;
-- RAISE NOTICE '✓ Dropped legacy sync_user_assignments_trigger';

-- ============================================================================
-- POST-FIX TEST QUERIES
-- ============================================================================
-- Run these AFTER the fix to verify everything works:

-- Test 1: Check triggers on users table
-- SELECT
--     trigger_name,
--     CASE
--         WHEN pg_get_triggerdef(t.oid) LIKE '%UPDATE OF department_id%' THEN 'department_id'
--         WHEN pg_get_triggerdef(t.oid) LIKE '%UPDATE OF role_id%' THEN 'role_id'
--         ELSE 'INSERT'
--     END as fires_on
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- WHERE c.relname = 'users'
--   AND NOT t.tgisinternal
-- ORDER BY trigger_name;

-- Test 2: Verify no duplicate training logs
-- SELECT auth_id, topic, date, COUNT(*) as count
-- FROM training_logs
-- GROUP BY auth_id, topic, date
-- HAVING COUNT(*) > 1;

-- Test 3: Check role_assignments triggers
-- SELECT
--     t.tgname as trigger_name,
--     p.proname as function_name
-- FROM pg_trigger t
-- JOIN pg_class c ON t.tgrelid = c.oid
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE c.relname = 'role_assignments'
--   AND NOT t.tgisinternal
-- ORDER BY t.tgname;
