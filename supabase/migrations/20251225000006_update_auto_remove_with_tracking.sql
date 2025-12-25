-- Migration: Update auto-remove trigger to use auto_assigned_from_module column
-- This replaces the previous auto_remove_module_documents function with a safer implementation

CREATE OR REPLACE FUNCTION auto_remove_module_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this was a module assignment
  IF OLD.item_type = 'module' THEN
    -- Delete document assignments that were auto-assigned from THIS specific module
    -- BUT only if those documents aren't also linked to OTHER modules the user is still assigned to
    DELETE FROM user_assignments
    WHERE auth_id = OLD.auth_id
      AND item_type = 'document'
      AND auto_assigned_from_module = OLD.item_id -- Only remove docs auto-assigned from this module
      -- Ensure we don't delete documents that are linked to other modules the user is still assigned to
      AND item_id NOT IN (
        SELECT dm2.document_id
        FROM document_modules dm2
        INNER JOIN user_assignments ua2 ON ua2.item_id = dm2.module_id
        WHERE ua2.auth_id = OLD.auth_id
          AND ua2.item_type = 'module'
          AND dm2.module_id != OLD.item_id -- Exclude the module being deleted
      );
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger is already created in previous migration, this just updates the function
-- But let's recreate it to be safe
DROP TRIGGER IF EXISTS trigger_auto_remove_module_documents ON user_assignments;
CREATE TRIGGER trigger_auto_remove_module_documents
  BEFORE DELETE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION auto_remove_module_documents();

-- Add comment for updated function
COMMENT ON FUNCTION auto_remove_module_documents() IS
  'Automatically removes document assignments when a module assignment is deleted.
   Only removes documents that:
   1. Were auto-assigned from the specific module being deleted (tracked via auto_assigned_from_module)
   2. Are NOT linked to other modules the user is still assigned to
   This ensures manually assigned documents are never removed, and documents shared across modules remain assigned.';
