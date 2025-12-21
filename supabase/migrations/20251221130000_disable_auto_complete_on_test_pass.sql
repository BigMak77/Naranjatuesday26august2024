-- ============================================================================
-- DISABLE AUTO-COMPLETE TRAINING ON TEST PASS
-- ============================================================================
-- This migration disables the automatic completion of training assignments
-- when tests are passed. Training should only be marked complete when the
-- trainer explicitly logs the training session with signatures.
-- ============================================================================

-- Drop the trigger that auto-completes training on test pass
DROP TRIGGER IF EXISTS trigger_auto_complete_training_on_test_pass ON test_attempts;

-- Optionally, we can keep the function in case we want to re-enable it later
-- But for now, we'll comment it out to make it clear it's not in use
COMMENT ON FUNCTION auto_complete_training_on_test_pass() IS
'DISABLED: Previously auto-marked training assignments as completed when users passed tests. Now training completion requires explicit trainer logging with signatures.';
