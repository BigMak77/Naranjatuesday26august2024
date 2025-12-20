-- ============================================================================
-- FIX USER_ASSIGNMENTS RLS POLICIES
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix the 400 errors on user_assignments
-- This allows authenticated users to query training data in the dashboard

-- Enable RLS on user_assignments
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can view own training" ON user_assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON user_assignments;

-- Policy: Allow authenticated users to view ALL assignments
-- This is needed for trainers/admins to see all user training data in the dashboard
CREATE POLICY "Authenticated users can view all assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'user_assignments'
ORDER BY policyname;
