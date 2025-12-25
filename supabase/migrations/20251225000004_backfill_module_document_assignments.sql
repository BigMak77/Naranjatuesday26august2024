-- Migration: Backfill document assignments for existing module assignments
-- This migration creates document assignments for all existing module assignments
-- that have linked documents but haven't had those documents assigned yet

-- Note: This migration should run AFTER the auto_assigned_from_module column is added
-- Insert document assignments for existing module assignments
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
  follow_up_assessment_due_date,
  completed_at,
  training_outcome,
  auto_assigned_from_module
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
  ua.follow_up_assessment_due_date,
  -- If the module is completed, auto-complete the document assignments
  CASE
    WHEN ua.completed_at IS NOT NULL THEN ua.completed_at
    ELSE NULL
  END,
  ua.training_outcome,
  ua.item_id  -- Track which module created this assignment
FROM user_assignments ua
INNER JOIN document_modules dm ON dm.module_id = ua.item_id
WHERE ua.item_type = 'module'
ON CONFLICT (auth_id, item_id, item_type) DO NOTHING; -- Skip if document already assigned

-- Log the backfill results
DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  GET DIAGNOSTICS backfilled_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % document assignments from existing module assignments', backfilled_count;
END $$;
