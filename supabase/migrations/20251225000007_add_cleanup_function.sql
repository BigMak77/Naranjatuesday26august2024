-- Migration: Add function to cleanup orphaned document assignments
-- This function removes document assignments that were auto-assigned from modules
-- but the user no longer has that module assignment

CREATE OR REPLACE FUNCTION cleanup_orphaned_document_assignments(
  p_auth_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  document_id UUID,
  orphaned_from_module UUID,
  action TEXT
) AS $$
BEGIN
  -- Delete and return document assignments that:
  -- 1. Were auto-assigned from a module (auto_assigned_from_module IS NOT NULL)
  -- 2. The user no longer has that module assignment
  -- 3. The document is not linked to any other modules the user is assigned to
  RETURN QUERY
  DELETE FROM user_assignments
  WHERE item_type = 'document'
    AND auto_assigned_from_module IS NOT NULL
    AND (p_auth_id IS NULL OR auth_id = p_auth_id)
    -- User no longer has the module assignment that created this document assignment
    AND NOT EXISTS (
      SELECT 1
      FROM user_assignments ua_mod
      WHERE ua_mod.auth_id = user_assignments.auth_id
        AND ua_mod.item_id = user_assignments.auto_assigned_from_module
        AND ua_mod.item_type = 'module'
    )
    -- Document is not linked to other modules the user is still assigned to
    AND item_id NOT IN (
      SELECT dm.document_id
      FROM document_modules dm
      INNER JOIN user_assignments ua_other ON ua_other.item_id = dm.module_id
      WHERE ua_other.auth_id = user_assignments.auth_id
        AND ua_other.item_type = 'module'
    )
  RETURNING auth_id, item_id, auto_assigned_from_module, 'removed'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_orphaned_document_assignments(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_orphaned_document_assignments(UUID) IS
  'Cleanup document assignments that were auto-assigned from modules but are now orphaned.
   A document assignment is considered orphaned if:
   1. It was auto-assigned from a module (auto_assigned_from_module IS NOT NULL)
   2. The user no longer has that module assignment
   3. The document is not linked to any other modules the user is currently assigned to

   Parameters:
   - p_auth_id: Optional user ID to cleanup (NULL = all users)

   Returns: List of removed assignments with module they were orphaned from';

-- Example usage:
-- SELECT * FROM cleanup_orphaned_document_assignments(); -- Cleanup all users
-- SELECT * FROM cleanup_orphaned_document_assignments('user-uuid-here'); -- Cleanup specific user
