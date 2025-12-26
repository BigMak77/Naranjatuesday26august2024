-- ============================================================================
-- UPDATE AUTO-COMPLETE TRIGGER TO INSERT INTO TRAINING_LOGS
-- ============================================================================
-- This migration updates the auto_complete_training_on_test_pass trigger
-- to also insert an entry into training_logs when a user passes a test.
-- This ensures the "Recent Training Completions" dashboard shows test completions.
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_complete_training_on_test_pass()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id uuid;
  v_user_auth_id uuid;
  v_module_name text;
  v_test_completed_at timestamp with time zone;
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

      -- Get test completion timestamp
      v_test_completed_at := COALESCE(NEW.completed_at, NOW());

      -- Update the user_assignments record to mark it as completed
      -- Only update if not already completed (to preserve original completion date)
      UPDATE user_assignments
      SET
        completed_at = COALESCE(completed_at, v_test_completed_at),
        training_outcome = COALESCE(training_outcome, 'completed')
      WHERE auth_id = v_user_auth_id
        AND item_id = v_module_id
        AND item_type = 'module'
        AND completed_at IS NULL; -- Only update if not already completed

      -- Insert into training_logs for dashboard tracking
      -- Check if a log entry already exists for this completion to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM training_logs
        WHERE auth_id = v_user_auth_id
          AND topic = v_module_id
          AND date = DATE(v_test_completed_at)
      ) THEN

        INSERT INTO training_logs (
          auth_id,
          date,
          topic,
          duration_hours,
          outcome,
          notes,
          signature,
          trainer_signature,
          time
        ) VALUES (
          v_user_auth_id,
          DATE(v_test_completed_at),
          v_module_id,
          1, -- Default duration for test completions
          'completed',
          'Auto-logged from test completion',
          NULL, -- No signatures for auto-logged completions
          NULL,
          CAST(v_test_completed_at AS time)
        );

        RAISE NOTICE 'Training log created for user % on module % after passing test',
          v_user_auth_id, v_module_id;
      END IF;

      -- Log for debugging
      RAISE NOTICE 'Auto-completed training for user % on module % after passing test',
        v_user_auth_id, v_module_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION auto_complete_training_on_test_pass() IS
'Trigger function that automatically marks a training assignment as completed and creates a training log entry when a user passes the associated test';
