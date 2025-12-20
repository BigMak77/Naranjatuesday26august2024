-- ============================================================================
-- AUTO-COMPLETE TRAINING ON TEST PASS
-- ============================================================================
-- This migration adds a trigger that automatically marks a user's training
-- assignment as completed when they pass a test for a module that has an
-- associated question pack.
--
-- Flow:
-- 1. User submits test via submit_attempt()
-- 2. Test is scored and test_attempts.passed is set to true
-- 3. Trigger fires and updates user_assignments.completed_at for that module
-- ============================================================================

-- ============================================================================
-- STEP 1: Create function to update user_assignments when test is passed
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_complete_training_on_test_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id uuid;
  v_user_auth_id uuid;
BEGIN
  -- Only proceed if the test was passed
  IF NEW.passed = true AND (OLD.passed IS NULL OR OLD.passed = false) THEN

    -- Get the module_id associated with this question pack
    SELECT module_id INTO v_module_id
    FROM question_packs
    WHERE id = NEW.pack_id;

    -- If this pack is linked to a module, update the user's assignment
    IF v_module_id IS NOT NULL THEN

      -- Get the user's auth_id from the users table
      SELECT auth_id INTO v_user_auth_id
      FROM users
      WHERE id = NEW.user_id;

      -- Update the user_assignments record to mark it as completed
      -- Only update if not already completed (to preserve original completion date)
      UPDATE user_assignments
      SET
        completed_at = COALESCE(completed_at, NOW())
      WHERE auth_id = v_user_auth_id
        AND item_id = v_module_id
        AND item_type = 'module';

      -- Log for debugging
      RAISE NOTICE 'Auto-completed training for user % on module % after passing test',
        v_user_auth_id, v_module_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_complete_training_on_test_pass() IS
'Trigger function that automatically marks a training assignment as completed when a user passes the associated test';

-- ============================================================================
-- STEP 2: Create trigger on test_attempts table
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_auto_complete_training_on_test_pass ON test_attempts;

CREATE TRIGGER trigger_auto_complete_training_on_test_pass
  AFTER INSERT OR UPDATE OF passed
  ON test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION auto_complete_training_on_test_pass();

COMMENT ON TRIGGER trigger_auto_complete_training_on_test_pass ON test_attempts IS
'Automatically marks training assignments as completed when users pass tests';

-- ============================================================================
-- STEP 3: Backfill existing data (optional)
-- ============================================================================
-- Update user_assignments for any users who have already passed tests
-- but don't have completed_at set

DO $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  -- Update assignments where user has passed a test but assignment is not marked complete
  WITH passed_tests AS (
    SELECT DISTINCT
      ta.user_id,
      qp.module_id,
      MIN(ta.completed_at) as first_pass_date
    FROM test_attempts ta
    JOIN question_packs qp ON ta.pack_id = qp.id
    WHERE ta.passed = true
      AND qp.module_id IS NOT NULL
    GROUP BY ta.user_id, qp.module_id
  ),
  user_auth_mapping AS (
    SELECT
      u.id as user_id,
      u.auth_id
    FROM users u
  )
  UPDATE user_assignments ua
  SET
    completed_at = pt.first_pass_date
  FROM passed_tests pt
  JOIN user_auth_mapping uam ON pt.user_id = uam.user_id
  WHERE ua.auth_id = uam.auth_id
    AND ua.item_id = pt.module_id
    AND ua.item_type = 'module'
    AND ua.completed_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE 'Backfilled % training assignments with completion dates from passed tests', v_updated_count;
END $$;
