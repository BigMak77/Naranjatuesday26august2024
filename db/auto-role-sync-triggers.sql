-- SQL script to create automatic role assignment sync triggers
-- Run this in your Supabase SQL editor

-- 1. Create a log table for role changes (optional but recommended)
CREATE TABLE IF NOT EXISTS user_role_change_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  old_role_id UUID REFERENCES roles(id),
  new_role_id UUID REFERENCES roles(id),
  assignments_removed INTEGER DEFAULT 0,
  assignments_added INTEGER DEFAULT 0,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID DEFAULT auth.uid()
);

-- 2. Create a function to sync user assignments when role changes
CREATE OR REPLACE FUNCTION sync_user_role_assignments()
RETURNS TRIGGER AS $$
DECLARE
  user_auth_id UUID;
  removed_count INTEGER := 0;
  added_count INTEGER := 0;
BEGIN
  -- Only process if role_id actually changed
  IF OLD.role_id IS DISTINCT FROM NEW.role_id THEN
    
    -- Get user's auth_id
    user_auth_id := NEW.auth_id;
    
    -- Remove ALL existing assignments for this user (clean slate approach)
    WITH deleted_assignments AS (
      DELETE FROM user_assignments ua
      WHERE ua.auth_id = user_auth_id
      RETURNING *
    )
    SELECT COUNT(*) INTO removed_count FROM deleted_assignments;
    
    RAISE NOTICE 'Removed % assignments for user %', removed_count, NEW.id;
    
    -- Add new role assignments
    IF NEW.role_id IS NOT NULL THEN
      -- Insert new assignments for the new role
      WITH new_role_assignments AS (
        SELECT DISTINCT
          NEW.auth_id,
          COALESCE(ra.document_id, ra.module_id) as item_id,
          ra.type as item_type,
          NOW() as assigned_at
        FROM role_assignments ra
        WHERE ra.role_id = NEW.role_id
        AND NOT EXISTS (
          SELECT 1 FROM user_assignments ua 
          WHERE ua.auth_id = NEW.auth_id 
          AND ua.item_id = COALESCE(ra.document_id, ra.module_id)
          AND ua.item_type = ra.type
        )
      ),
      inserted_assignments AS (
        INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
        SELECT auth_id, item_id, item_type, assigned_at
        FROM new_role_assignments
        RETURNING *
      )
      SELECT COUNT(*) INTO added_count FROM inserted_assignments;
    END IF;
    
    -- Log the change
    INSERT INTO user_role_change_log (
      user_id, old_role_id, new_role_id, 
      assignments_removed, assignments_added
    ) VALUES (
      NEW.id, OLD.role_id, NEW.role_id,
      removed_count, added_count
    );
    
    -- Log to server logs
    RAISE NOTICE 'Role sync for user %: removed %, added %', 
      NEW.id, removed_count, added_count;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger on users table
DROP TRIGGER IF EXISTS sync_role_assignments_trigger ON users;
CREATE TRIGGER sync_role_assignments_trigger
  AFTER UPDATE OF role_id ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_assignments();

-- 4. Create a function to manually sync a specific user
CREATE OR REPLACE FUNCTION manual_sync_user_assignments(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_record RECORD;
  result JSON;
BEGIN
  -- Get user info
  SELECT * INTO user_record FROM users WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Trigger the sync by updating the role_id to itself
  UPDATE users 
  SET role_id = role_id, 
      last_updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'User assignments synced',
    'user_id', target_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- 5. Create a function to sync all users
CREATE OR REPLACE FUNCTION sync_all_user_assignments()
RETURNS JSON AS $$
DECLARE
  user_count INTEGER;
  synced_count INTEGER := 0;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM users WHERE role_id IS NOT NULL;
  
  -- Update all users to trigger sync
  UPDATE users 
  SET last_updated_at = NOW()
  WHERE role_id IS NOT NULL;
  
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'total_users', user_count,
    'synced_users', synced_count,
    'message', 'All user assignments synced'
  );
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- Manual sync single user: SELECT manual_sync_user_assignments('user-uuid-here');
-- Sync all users: SELECT sync_all_user_assignments();
-- View role change log: SELECT * FROM user_role_change_log ORDER BY changed_at DESC;
