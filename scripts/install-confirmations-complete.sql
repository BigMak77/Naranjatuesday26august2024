-- Complete installation script for document confirmations
-- This script drops old views and recreates everything fresh

-- Step 1: Drop old views and functions if they exist
DROP VIEW IF EXISTS pending_confirmations CASCADE;
DROP VIEW IF EXISTS confirmation_report CASCADE;
DROP FUNCTION IF EXISTS confirm_user_assignment(UUID, TEXT, TEXT, INET) CASCADE;
DROP FUNCTION IF EXISTS get_pending_confirmations_count(UUID) CASCADE;

-- Step 2: Add confirmation columns to user_assignments table
ALTER TABLE user_assignments
ADD COLUMN IF NOT EXISTS confirmation_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmation_signature TEXT,
ADD COLUMN IF NOT EXISTS confirmation_ip_address INET,
ADD COLUMN IF NOT EXISTS confirmation_notes TEXT;

-- Step 3: Add indexes for filtering by confirmation status
CREATE INDEX IF NOT EXISTS idx_user_assignments_confirmation_required
  ON user_assignments(confirmation_required)
  WHERE confirmation_required = true;

CREATE INDEX IF NOT EXISTS idx_user_assignments_confirmed_at
  ON user_assignments(confirmed_at)
  WHERE confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_assignments_unconfirmed
  ON user_assignments(auth_id, item_type)
  WHERE confirmation_required = true AND confirmed_at IS NULL;

-- Step 4: Add comments to explain the new columns
COMMENT ON COLUMN user_assignments.confirmation_required IS 'Whether this assignment requires user confirmation/acknowledgment before completion';
COMMENT ON COLUMN user_assignments.confirmed_at IS 'Timestamp when the user confirmed/acknowledged the assignment';
COMMENT ON COLUMN user_assignments.confirmation_signature IS 'Electronic signature (full name) provided during confirmation';
COMMENT ON COLUMN user_assignments.confirmation_ip_address IS 'IP address from which confirmation was made';
COMMENT ON COLUMN user_assignments.confirmation_notes IS 'Additional notes or agreement text from confirmation';

-- Step 5: Create view for assignments requiring confirmation
CREATE OR REPLACE VIEW pending_confirmations AS
SELECT
  ua.id as assignment_id,
  ua.auth_id,
  ua.item_id,
  ua.item_type,
  ua.assigned_at,
  ua.due_at,
  ua.confirmation_required,
  ua.confirmed_at,
  ua.confirmation_signature,
  u.first_name || ' ' || u.last_name as user_name,
  u.email as user_email,
  dept.name as department,
  CASE
    WHEN ua.item_type = 'document' THEN d.title
    WHEN ua.item_type = 'module' THEN m.name
    ELSE NULL
  END as item_title,
  CASE
    WHEN ua.item_type = 'document' THEN d.reference_code
    ELSE NULL
  END as reference_code,
  CASE
    WHEN ua.item_type = 'document' THEN d.file_url
    ELSE NULL
  END as document_url
FROM user_assignments ua
LEFT JOIN users u ON ua.auth_id = u.auth_id
LEFT JOIN departments dept ON u.department_id = dept.id
LEFT JOIN documents d ON ua.item_type = 'document' AND ua.item_id = d.id
LEFT JOIN modules m ON ua.item_type = 'module' AND ua.item_id = m.id
WHERE ua.confirmation_required = true
  AND ua.confirmed_at IS NULL
ORDER BY ua.due_at ASC NULLS LAST, ua.assigned_at DESC;

-- Step 6: Create view for confirmed assignments report
CREATE OR REPLACE VIEW confirmation_report AS
SELECT
  ua.id as assignment_id,
  ua.auth_id,
  ua.item_id,
  ua.item_type,
  ua.assigned_at,
  ua.confirmed_at,
  ua.confirmation_signature,
  ua.confirmation_ip_address,
  u.first_name || ' ' || u.last_name as user_name,
  u.email as user_email,
  dept.name as department,
  CASE
    WHEN ua.item_type = 'document' THEN d.title
    WHEN ua.item_type = 'module' THEN m.name
    ELSE NULL
  END as item_title,
  CASE
    WHEN ua.item_type = 'document' THEN d.reference_code
    ELSE NULL
  END as reference_code,
  EXTRACT(EPOCH FROM (ua.confirmed_at - ua.assigned_at))/3600 as hours_to_confirm
FROM user_assignments ua
LEFT JOIN users u ON ua.auth_id = u.auth_id
LEFT JOIN departments dept ON u.department_id = dept.id
LEFT JOIN documents d ON ua.item_type = 'document' AND ua.item_id = d.id
LEFT JOIN modules m ON ua.item_type = 'module' AND ua.item_id = m.id
WHERE ua.confirmation_required = true
  AND ua.confirmed_at IS NOT NULL
ORDER BY ua.confirmed_at DESC;

-- Step 7: Grant access to the views
GRANT SELECT ON pending_confirmations TO authenticated;
GRANT SELECT ON confirmation_report TO authenticated;

-- Step 8: Add comments to views
COMMENT ON VIEW pending_confirmations IS 'Shows all assignments requiring confirmation that have not yet been confirmed';
COMMENT ON VIEW confirmation_report IS 'Shows all confirmed assignments with confirmation details and time metrics';

-- Step 9: Create function to mark an assignment as confirmed
CREATE OR REPLACE FUNCTION confirm_user_assignment(
  p_assignment_id UUID,
  p_signature TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_auth_id UUID;
BEGIN
  -- Get the auth_id for this assignment
  SELECT auth_id INTO v_auth_id
  FROM user_assignments
  WHERE id = p_assignment_id;

  -- Verify the current user owns this assignment
  IF v_auth_id != auth.uid() THEN
    RAISE EXCEPTION 'You can only confirm your own assignments';
  END IF;

  -- Update the assignment
  UPDATE user_assignments
  SET
    confirmed_at = NOW(),
    confirmation_signature = p_signature,
    confirmation_notes = p_notes,
    confirmation_ip_address = p_ip_address
  WHERE id = p_assignment_id
    AND confirmation_required = true
    AND confirmed_at IS NULL
  RETURNING jsonb_build_object(
    'assignment_id', id,
    'confirmed_at', confirmed_at,
    'signature', confirmation_signature
  ) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Assignment not found, already confirmed, or does not require confirmation';
  END IF;

  RETURN v_result;
END;
$$;

-- Step 10: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION confirm_user_assignment TO authenticated;

COMMENT ON FUNCTION confirm_user_assignment IS 'Marks a user assignment as confirmed with optional signature and notes. Users can only confirm their own assignments.';

-- Step 11: Create function to check if a user has pending confirmations
CREATE OR REPLACE FUNCTION get_pending_confirmations_count(p_auth_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM user_assignments
  WHERE auth_id = p_auth_id
    AND confirmation_required = true
    AND confirmed_at IS NULL;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_confirmations_count TO authenticated;

COMMENT ON FUNCTION get_pending_confirmations_count IS 'Returns the count of pending confirmations for a user';

-- Installation complete!
SELECT 'Document confirmation system installed successfully!' as status;
