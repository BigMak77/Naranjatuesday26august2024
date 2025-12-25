-- Migration: Add function to manually sync module document assignments
-- This function can be called manually to sync document assignments for specific users or modules
-- Useful for bulk operations, testing, or re-syncing after changes

CREATE OR REPLACE FUNCTION sync_module_document_assignments(
  p_auth_id UUID DEFAULT NULL,
  p_module_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  document_id UUID,
  action TEXT
) AS $$
BEGIN
  -- Insert document assignments based on filter criteria
  -- Note: This initial version does NOT set auto_assigned_from_module
  -- That column will be added in a later migration and this function will be updated
  RETURN QUERY
  INSERT INTO user_assignments (
    auth_id,
    item_id,
    item_type,
    assigned_at,
    due_at,
    confirmation_required,
    assignment_reason,
    refresh_due_date,
    follow_up_assessment_required,
    follow_up_assessment_due_date
  )
  SELECT
    ua.auth_id,
    dm.document_id,
    'document'::TEXT,
    ua.assigned_at,
    ua.due_at,
    ua.confirmation_required,
    ua.assignment_reason,
    ua.refresh_due_date,
    ua.follow_up_assessment_required,
    ua.follow_up_assessment_due_date
  FROM user_assignments ua
  INNER JOIN document_modules dm ON dm.module_id = ua.item_id
  WHERE ua.item_type = 'module'
    AND (p_auth_id IS NULL OR ua.auth_id = p_auth_id)
    AND (p_module_id IS NULL OR ua.item_id = p_module_id)
  ON CONFLICT (auth_id, item_id, item_type) DO NOTHING
  RETURNING auth_id, item_id, 'created'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION sync_module_document_assignments(UUID, UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION sync_module_document_assignments(UUID, UUID) IS
  'Manually sync document assignments for module assignments.
   Parameters:
   - p_auth_id: Optional user ID to sync (NULL = all users)
   - p_module_id: Optional module ID to sync (NULL = all modules)
   Returns: List of created assignments';

-- Example usage:
-- SELECT * FROM sync_module_document_assignments(); -- Sync all
-- SELECT * FROM sync_module_document_assignments('user-uuid-here', NULL); -- Sync specific user
-- SELECT * FROM sync_module_document_assignments(NULL, 'module-uuid-here'); -- Sync specific module
