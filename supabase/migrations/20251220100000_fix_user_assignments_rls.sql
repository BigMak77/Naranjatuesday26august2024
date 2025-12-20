-- ============================================================================
-- FIX USER_ASSIGNMENTS RLS POLICIES
-- ============================================================================
-- This migration ensures that the user_assignments table has proper RLS policies
-- to allow authenticated users to query their training data

-- Enable RLS on user_assignments if not already enabled
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can view own training" ON user_assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON user_assignments;

-- Policy: Allow authenticated users to view ALL assignments
-- This is needed for trainers/admins to see all user training data
CREATE POLICY "Authenticated users can view all assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow users to view their own assignments (belt and suspenders)
CREATE POLICY "Users can view own assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (auth_id = auth.uid());

-- Policy: Allow users to update their own assignments (for marking as complete)
CREATE POLICY "Users can update own assignments"
  ON user_assignments
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Grant permissions
GRANT SELECT ON user_assignments TO authenticated, anon;
GRANT UPDATE ON user_assignments TO authenticated;

-- Add comment
COMMENT ON TABLE user_assignments IS 'Stores training assignments for users. RLS allows authenticated users to view all assignments (needed for trainers/admins) and update their own.';
