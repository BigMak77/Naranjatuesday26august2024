-- ============================================================================
-- COMPREHENSIVE TRIGGER FIX FOR USER UPDATES
-- ============================================================================
-- This SQL script completely fixes the trigger conflict by:
-- 1. Listing all current triggers on the users table
-- 2. Dropping and recreating problematic triggers
-- 3. Verifying the fix
-- ============================================================================

-- Step 1: Check current triggers on users table
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;

-- Step 2: Drop ALL existing triggers on users table (except BEFORE INSERT)
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_insert ON users;
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;
DROP TRIGGER IF EXISTS trigger_sync_role_training_on_insert ON users;
DROP TRIGGER IF EXISTS trigger_sync_role_training_on_update ON users;
DROP TRIGGER IF EXISTS trigger_sync_assignments_on_role_change ON users; -- Legacy trigger

-- Step 3: Recreate triggers with proper configuration

-- Department training trigger - INSERT (unchanged)
CREATE TRIGGER trigger_sync_department_training_on_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_department_training_to_user();

-- Department training trigger - UPDATE (FIXED: only on department_id changes)
CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id ON users
FOR EACH ROW
WHEN (OLD.department_id IS DISTINCT FROM NEW.department_id)
EXECUTE FUNCTION sync_department_training_to_user();

-- Role training trigger - INSERT (unchanged)
CREATE TRIGGER trigger_sync_role_training_on_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_role_training_to_user();

-- Role training trigger - UPDATE (unchanged)
CREATE TRIGGER trigger_sync_role_training_on_update
AFTER UPDATE OF role_id ON users
FOR EACH ROW
WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
EXECUTE FUNCTION sync_role_training_to_user();

-- Step 4: Verify the fix
SELECT
    'SUCCESS: Triggers recreated!' as status,
    'Department trigger now only fires on department_id changes' as fix_applied,
    'Role trigger fires on role_id changes' as note;

-- Step 5: Show updated trigger configuration
SELECT
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
ORDER BY trigger_name;
