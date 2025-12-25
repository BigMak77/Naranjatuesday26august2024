-- Migration: Add tracking column for auto-assigned documents
-- This adds a column to track whether a document assignment was auto-created from a module assignment
-- This makes it safer to determine which documents to remove when a module is unassigned

-- Add column to track auto-assigned documents
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS auto_assigned_from_module UUID REFERENCES modules(id) ON DELETE SET NULL;

-- Add index for performance when querying auto-assigned documents
CREATE INDEX IF NOT EXISTS idx_user_assignments_auto_assigned
ON user_assignments(auto_assigned_from_module)
WHERE auto_assigned_from_module IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_assignments.auto_assigned_from_module IS
  'If this document assignment was auto-created from a module assignment, this contains the module ID.
   NULL means the assignment was created manually or is not a document assignment.
   Used to determine which documents to remove when a module assignment is deleted.';

-- Update existing auto-assigned documents (backfill)
-- This is a best-effort attempt to mark existing auto-assigned documents
-- It matches documents that were assigned at the same time as a module to the same user
UPDATE user_assignments AS doc
SET auto_assigned_from_module = mod.item_id
FROM user_assignments AS mod
INNER JOIN document_modules dm ON dm.module_id = mod.item_id
WHERE doc.item_type = 'document'
  AND mod.item_type = 'module'
  AND doc.auth_id = mod.auth_id
  AND doc.item_id = dm.document_id
  AND doc.assignment_reason = mod.assignment_reason
  AND ABS(EXTRACT(EPOCH FROM (doc.assigned_at - mod.assigned_at))) < 60 -- Within 60 seconds
  AND doc.auto_assigned_from_module IS NULL; -- Only update if not already set

-- Log the backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  GET DIAGNOSTICS backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled auto_assigned_from_module for % existing document assignments', backfilled_count;
END $$;
