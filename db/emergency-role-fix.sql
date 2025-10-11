-- Emergency fix: Create database trigger that automatically syncs assignments when role changes
-- Run this in Supabase SQL editor to fix the immediate issue

-- 1. Create improved trigger function that handles role changes
CREATE OR REPLACE FUNCTION sync_user_assignments_on_role_change()
RETURNS TRIGGER AS $$
DECLARE
  removed_count INTEGER := 0;
  added_count INTEGER := 0;
BEGIN
  -- Only process if role_id actually changed
  IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    
    RAISE NOTICE 'Role change detected for user %: % -> %', NEW.id, OLD.role_id, NEW.role_id;
    
    -- Remove ALL existing assignments for this user (clean slate)
    WITH deleted_assignments AS (
      DELETE FROM user_assignments
      WHERE auth_id = NEW.auth_id
      RETURNING *
    )
    SELECT COUNT(*) INTO removed_count FROM deleted_assignments;
    
    RAISE NOTICE 'Removed % assignments for user %', removed_count, NEW.id;
    
    -- Add new assignments for the new role (if role is not null)
    IF NEW.role_id IS NOT NULL THEN
      WITH new_assignments AS (
        INSERT INTO user_assignments (auth_id, item_id, item_type, role_assignment_id, assigned_at)
        SELECT DISTINCT
          NEW.auth_id,
          COALESCE(ra.document_id, ra.module_id) as item_id,
          ra.type as item_type,
          ra.id as role_assignment_id,
          NOW() as assigned_at
        FROM role_assignments ra
        WHERE ra.role_id = NEW.role_id
        AND COALESCE(ra.document_id, ra.module_id) IS NOT NULL
        RETURNING *
      )
      SELECT COUNT(*) INTO added_count FROM new_assignments;
      
      RAISE NOTICE 'Added % assignments for user %', added_count, NEW.id;
    END IF;
    
    -- Log the change (only if log table exists)
    BEGIN
      INSERT INTO user_role_change_log (
        user_id, old_role_id, new_role_id, 
        assignments_removed, assignments_added, changed_at
      ) VALUES (
        NEW.id, OLD.role_id, NEW.role_id,
        removed_count, added_count, NOW()
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE 'Log table does not exist, skipping log entry';
    END;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_sync_user_assignments ON users;

-- 3. Create the trigger
CREATE TRIGGER auto_sync_user_assignments
  AFTER UPDATE OF role_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_assignments_on_role_change();

-- 4. Function to manually fix a specific user (emergency use)
CREATE OR REPLACE FUNCTION emergency_fix_user_assignments(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  removed_count INTEGER := 0;
  added_count INTEGER := 0;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Remove all existing assignments
  WITH deleted_assignments AS (
    DELETE FROM user_assignments
    WHERE auth_id = user_record.auth_id
    RETURNING *
  )
  SELECT COUNT(*) INTO removed_count FROM deleted_assignments;
  
  -- Add assignments for current role
  IF user_record.role_id IS NOT NULL THEN
    WITH new_assignments AS (
      INSERT INTO user_assignments (auth_id, item_id, item_type, role_assignment_id, assigned_at)
      SELECT DISTINCT
        user_record.auth_id,
        COALESCE(ra.document_id, ra.module_id) as item_id,
        ra.type as item_type,
        ra.id as role_assignment_id,
        NOW() as assigned_at
      FROM role_assignments ra
      WHERE ra.role_id = user_record.role_id
      AND COALESCE(ra.document_id, ra.module_id) IS NOT NULL
      RETURNING *
    )
    SELECT COUNT(*) INTO added_count FROM new_assignments;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'role_id', user_record.role_id,
    'removed', removed_count,
    'added', added_count,
    'message', format('Fixed assignments: removed %s, added %s', removed_count, added_count)
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Fix a specific user (replace with actual user ID)
-- SELECT emergency_fix_user_assignments('YOUR_USER_ID_HERE');

-- 6. Function to check if a user's assignments are correct
CREATE OR REPLACE FUNCTION check_user_assignments(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  current_count INTEGER;
  expected_count INTEGER;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Count current assignments
  SELECT COUNT(*) INTO current_count
  FROM user_assignments
  WHERE auth_id = user_record.auth_id;
  
  -- Count expected assignments
  SELECT COUNT(DISTINCT COALESCE(ra.document_id, ra.module_id)) INTO expected_count
  FROM role_assignments ra
  WHERE ra.role_id = user_record.role_id
  AND COALESCE(ra.document_id, ra.module_id) IS NOT NULL;
  
  RETURN json_build_object(
    'user_id', target_user_id,
    'role_id', user_record.role_id,
    'current_assignments', current_count,
    'expected_assignments', expected_count,
    'is_correct', current_count = expected_count,
    'needs_fix', current_count != expected_count
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- Check if user needs fix: SELECT check_user_assignments('user-id-here');
-- Fix specific user: SELECT emergency_fix_user_assignments('user-id-here');
-- Fix all users: UPDATE users SET role_id = role_id WHERE role_id IS NOT NULL;
