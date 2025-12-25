-- Migration: Auto-remove linked documents when a module assignment is removed
-- This trigger automatically removes document assignments that were linked to a module
-- when the user's module assignment is deleted

-- Create the trigger function for handling deletions
CREATE OR REPLACE FUNCTION auto_remove_module_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this was a module assignment
  IF OLD.item_type = 'module' THEN
    -- Delete document assignments that were linked to this module
    -- BUT only if those documents aren't also linked to OTHER modules the user is still assigned to
    DELETE FROM user_assignments
    WHERE auth_id = OLD.auth_id
      AND item_type = 'document'
      AND item_id IN (
        -- Get documents linked to the module being removed
        SELECT dm.document_id
        FROM document_modules dm
        WHERE dm.module_id = OLD.item_id
      )
      -- Ensure we don't delete documents that are linked to other modules the user is still assigned to
      AND item_id NOT IN (
        SELECT dm2.document_id
        FROM document_modules dm2
        INNER JOIN user_assignments ua2 ON ua2.item_id = dm2.module_id
        WHERE ua2.auth_id = OLD.auth_id
          AND ua2.item_type = 'module'
          AND dm2.module_id != OLD.item_id -- Exclude the module being deleted
      )
      -- Also ensure we don't delete documents that were manually assigned (not auto-assigned)
      -- We identify auto-assigned documents by checking if they have the same assignment_reason
      -- and were assigned around the same time as the module
      AND assignment_reason = OLD.assignment_reason
      AND ABS(EXTRACT(EPOCH FROM (assigned_at - OLD.assigned_at))) < 60; -- Within 60 seconds
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires before a user_assignment is deleted
DROP TRIGGER IF EXISTS trigger_auto_remove_module_documents ON user_assignments;
CREATE TRIGGER trigger_auto_remove_module_documents
  BEFORE DELETE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION auto_remove_module_documents();

-- Add comment for documentation
COMMENT ON FUNCTION auto_remove_module_documents() IS
  'Automatically removes document assignments linked to a module when that module assignment is deleted.
   Only removes documents that:
   1. Are linked to the deleted module
   2. Are NOT linked to other modules the user is still assigned to
   3. Were auto-assigned (same assignment_reason and assigned within 60 seconds of module)';
