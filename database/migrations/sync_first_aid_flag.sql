-- =====================================================
-- FIRST AID SYNCHRONIZATION TRIGGER
-- =====================================================
-- Purpose: Automatically sync users.is_first_aid flag when
--          first aid module assignments are added/removed
-- Created: 2025-12-27
-- Source of Truth: user_assignments table
-- Synced Field: users.is_first_aid
-- =====================================================

-- First Aid Module ID (hardcoded constant across the application)
-- Location references:
--   - AddFirstAidDialog.tsx:29
--   - AddFirstAidWidget.tsx:56
--   - ViewFirstAidersDialog.tsx:29
DO $$
BEGIN
  -- Note: The module ID 'f1236b6b-ee01-4e68-9082-e2380b0fa600' is used throughout the app
  -- If this module doesn't exist, the trigger will still work but won't affect any users
  RAISE NOTICE 'First Aid Module ID: f1236b6b-ee01-4e68-9082-e2380b0fa600';
END $$;

-- =====================================================
-- DROP EXISTING TRIGGER AND FUNCTION (IF THEY EXIST)
-- =====================================================

DROP TRIGGER IF EXISTS sync_first_aid_trigger ON user_assignments;
DROP FUNCTION IF EXISTS sync_first_aid_flag();

-- =====================================================
-- CREATE FUNCTION TO SYNC is_first_aid FLAG
-- =====================================================

CREATE OR REPLACE FUNCTION sync_first_aid_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with function owner privileges
AS $$
DECLARE
  first_aid_module_id UUID := 'f1236b6b-ee01-4e68-9082-e2380b0fa600';
  affected_auth_id UUID;
BEGIN
  -- Determine which auth_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_auth_id := OLD.auth_id;
  ELSE
    affected_auth_id := NEW.auth_id;
  END IF;

  -- Only process if this is a first aid module assignment
  IF (TG_OP = 'DELETE' AND OLD.item_type = 'module' AND OLD.item_id = first_aid_module_id) OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.item_type = 'module' AND NEW.item_id = first_aid_module_id) THEN

    -- Log the operation for debugging
    RAISE NOTICE 'First aid sync triggered: % for auth_id %', TG_OP, affected_auth_id;

    IF TG_OP = 'DELETE' THEN
      -- First aid assignment was removed
      -- Set is_first_aid to FALSE for this user
      UPDATE users
      SET is_first_aid = false
      WHERE auth_id = affected_auth_id;

      RAISE NOTICE 'Removed first aid flag for user with auth_id: %', affected_auth_id;

    ELSIF TG_OP IN ('INSERT', 'UPDATE') THEN
      -- First aid assignment was added or updated
      -- Set is_first_aid to TRUE for this user
      UPDATE users
      SET is_first_aid = true
      WHERE auth_id = affected_auth_id;

      RAISE NOTICE 'Set first aid flag for user with auth_id: %', affected_auth_id;
    END IF;
  END IF;

  -- Return the appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION sync_first_aid_flag() IS
  'Automatically syncs users.is_first_aid flag when first aid module assignments change. Source of truth is user_assignments table with module ID f1236b6b-ee01-4e68-9082-e2380b0fa600';

-- =====================================================
-- CREATE TRIGGER ON user_assignments
-- =====================================================

CREATE TRIGGER sync_first_aid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_first_aid_flag();

-- Add comment to trigger
COMMENT ON TRIGGER sync_first_aid_trigger ON user_assignments IS
  'Syncs is_first_aid flag in users table when first aid module assignments change';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Uncomment these to verify the trigger was created:

-- SELECT
--   tgname AS trigger_name,
--   tgenabled AS enabled,
--   pg_get_triggerdef(oid) AS trigger_definition
-- FROM pg_trigger
-- WHERE tgname = 'sync_first_aid_trigger';

-- SELECT
--   proname AS function_name,
--   prosrc AS function_source
-- FROM pg_proc
-- WHERE proname = 'sync_first_aid_flag';

-- =====================================================
-- USAGE NOTES
-- =====================================================

/*
This trigger automatically keeps users.is_first_aid synchronized with
the user_assignments table.

BEHAVIOR:
  1. When a first aid module assignment is ADDED (INSERT):
     - Sets users.is_first_aid = true for that user

  2. When a first aid module assignment is UPDATED (UPDATE):
     - Sets users.is_first_aid = true for that user

  3. When a first aid module assignment is DELETED (DELETE):
     - Sets users.is_first_aid = false for that user

SOURCE OF TRUTH:
  - user_assignments table is the authoritative source
  - users.is_first_aid is a denormalized cache for quick lookups

MANAGEMENT:
  - Health & Safety team manages via H&S interface (adds/removes assignments)
  - HR can VIEW first aid status in People tab (read-only)
  - Bulk assignment of first aid removed from UserManagementPanel

RELATED FILES:
  - src/components/healthsafety/AddFirstAidDialog.tsx
  - src/components/healthsafety/AddFirstAidWidget.tsx
  - src/components/healthsafety/ViewFirstAidersDialog.tsx
  - src/components/user/UserManagementPanel.tsx (read-only display)

TESTING:
  Run the migration script: database/migrations/migrate_first_aid_data.sql
  to sync existing data before relying on this trigger.
*/
