-- ============================================================================
-- FIX USER UPDATE TRIGGER CONFLICTS
-- ============================================================================
-- This migration fixes the trigger conflict that occurs when updating both
-- department_id and role_id simultaneously. The conflict happens because:
-- 1. trigger_sync_department_training_on_update fires on both dept and role changes
-- 2. trigger_sync_role_training_on_update fires on role changes
-- Both triggers try to insert into user_assignments in the same transaction.
--
-- Solution: Disable the duplicate department trigger when role_id changes,
-- since the role trigger will handle all necessary training assignments.
-- ============================================================================

-- Drop and recreate the department training trigger to NOT fire on role_id changes
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;

CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id ON users
FOR EACH ROW
WHEN (OLD.department_id IS DISTINCT FROM NEW.department_id)
EXECUTE FUNCTION sync_department_training_to_user();

COMMENT ON TRIGGER trigger_sync_department_training_on_update ON users IS
'Syncs department training when department_id changes. Does NOT trigger on role_id changes to avoid conflicts with role training trigger.';
