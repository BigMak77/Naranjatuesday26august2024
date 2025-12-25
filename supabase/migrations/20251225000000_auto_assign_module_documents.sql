-- Migration: Auto-assign linked documents when a module is assigned to a user
-- This trigger automatically creates document assignments for all documents linked to a module
-- whenever a user is assigned to that module via user_assignments

-- Create the trigger function
CREATE OR REPLACE FUNCTION auto_assign_module_documents()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a module assignment
  IF NEW.item_type = 'module' THEN
    -- Insert document assignments for all documents linked to this module
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
      NEW.auth_id,                    -- Same user
      dm.document_id,                 -- Each linked document
      'document'::TEXT,               -- Item type is document
      NEW.assigned_at,                -- Inherit assigned date from module
      NEW.due_at,                     -- Inherit due date from module
      NEW.confirmation_required,      -- Inherit confirmation requirement
      NEW.assignment_reason,          -- Inherit assignment reason
      NEW.refresh_due_date,           -- Inherit refresh due date
      NEW.follow_up_assessment_required, -- Inherit follow-up requirement
      NEW.follow_up_assessment_due_date  -- Inherit follow-up due date
    FROM document_modules dm
    WHERE dm.module_id = NEW.item_id
    ON CONFLICT (auth_id, item_id, item_type) DO NOTHING; -- Skip if document already assigned
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that fires after a new user_assignment is inserted
DROP TRIGGER IF EXISTS trigger_auto_assign_module_documents ON user_assignments;
CREATE TRIGGER trigger_auto_assign_module_documents
  AFTER INSERT ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_module_documents();

-- Add comment for documentation
COMMENT ON FUNCTION auto_assign_module_documents() IS
  'Automatically creates document assignments for all documents linked to a module when a user is assigned to that module';
