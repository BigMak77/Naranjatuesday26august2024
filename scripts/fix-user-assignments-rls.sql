-- Fix RLS policies for user_assignments table to allow users to view their own assignments

-- Enable RLS if not already enabled
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Admins and managers can view all assignments" ON user_assignments;
DROP POLICY IF EXISTS "Admins and managers can insert assignments" ON user_assignments;
DROP POLICY IF EXISTS "Admins and managers can update all assignments" ON user_assignments;
DROP POLICY IF EXISTS "Admins and managers can delete assignments" ON user_assignments;
DROP POLICY IF EXISTS "System can manage assignments" ON user_assignments;
DROP POLICY IF EXISTS "Service role can manage all assignments" ON user_assignments;

-- Policy 1: Users can view their own assignments
CREATE POLICY "Users can view their own assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_id);

-- Policy 2: Users can update their own assignments (for marking complete, opening, etc.)
CREATE POLICY "Users can update their own assignments"
  ON user_assignments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id);

-- Policy 3: Admins and managers can view all assignments
CREATE POLICY "Admins and managers can view all assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin', 'Dept. Manager', 'Manager', 'Trainer')
    )
  );

-- Policy 4: Admins and managers can insert assignments
CREATE POLICY "Admins and managers can insert assignments"
  ON user_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin', 'Dept. Manager', 'Manager', 'Trainer')
    )
  );

-- Policy 5: Admins and managers can update all assignments
CREATE POLICY "Admins and managers can update all assignments"
  ON user_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin', 'Dept. Manager', 'Manager', 'Trainer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin', 'Dept. Manager', 'Manager', 'Trainer')
    )
  );

-- Policy 6: Admins and managers can delete assignments
CREATE POLICY "Admins and managers can delete assignments"
  ON user_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin')
    )
  );

-- Add comments
COMMENT ON POLICY "Users can view their own assignments" ON user_assignments
  IS 'Allow users to view assignments where auth_id matches their auth.uid()';

COMMENT ON POLICY "Users can update their own assignments" ON user_assignments
  IS 'Allow users to update their own assignments (mark as opened/completed)';

COMMENT ON POLICY "Admins and managers can view all assignments" ON user_assignments
  IS 'Allow admins, managers, and trainers to view all user assignments';

COMMENT ON POLICY "Admins and managers can insert assignments" ON user_assignments
  IS 'Allow admins, managers, and trainers to create assignments for users';

COMMENT ON POLICY "Admins and managers can update all assignments" ON user_assignments
  IS 'Allow admins, managers, and trainers to update any assignments';

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles::text, cmd
FROM pg_policies
WHERE tablename = 'user_assignments'
ORDER BY policyname;
