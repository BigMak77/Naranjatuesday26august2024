-- ============================================================================
-- IMMEDIATE FIX FOR TRIGGER CONFLICT
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to fix the trigger conflict
-- that occurs when updating user roles.
--
-- The problem: The department training trigger fires on BOTH department_id
-- and role_id changes, causing a conflict with the role training trigger.
--
-- The solution: Make the department trigger only fire on department_id changes.
-- ============================================================================

-- Drop and recreate the department training trigger to NOT fire on role_id changes
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;

CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id ON users
FOR EACH ROW
WHEN (OLD.department_id IS DISTINCT FROM NEW.department_id)
EXECUTE FUNCTION sync_department_training_to_user();

-- Verify the fix
SELECT
    'Trigger successfully updated!' as status,
    'The department training trigger now only fires on department_id changes' as note;
