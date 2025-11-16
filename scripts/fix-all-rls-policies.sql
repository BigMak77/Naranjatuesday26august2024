-- Comprehensive RLS Policy Fix for user_assignments and role_assignments
-- This script ensures both tables have proper RLS policies

-- =====================================================
-- Fix user_assignments table
-- =====================================================

-- Enable RLS
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Policy 2: Users can update their own assignments (for marking complete, etc.)
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

-- Policy 6: Admins can delete assignments
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

-- =====================================================
-- Fix role_assignments table
-- =====================================================

-- Enable RLS
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can insert role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can update role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can delete role assignments" ON role_assignments;

-- Policy 1: Anyone authenticated can view role assignments
CREATE POLICY "Anyone can view role assignments"
  ON role_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Admins can insert role assignments
CREATE POLICY "Admins can insert role assignments"
  ON role_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin')
    )
  );

-- Policy 3: Admins can update role assignments
CREATE POLICY "Admins can update role assignments"
  ON role_assignments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin')
    )
  );

-- Policy 4: Admins can delete role assignments
CREATE POLICY "Admins can delete role assignments"
  ON role_assignments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'Admin', 'HR Admin')
    )
  );

-- =====================================================
-- Verify the changes
-- =====================================================

-- Show user_assignments policies
SELECT
  '=== user_assignments policies ===' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_assignments'
ORDER BY policyname;

-- Show role_assignments policies
SELECT
  '=== role_assignments policies ===' as info,
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'role_assignments'
ORDER BY policyname;

-- Summary
SELECT
  'RLS policies updated successfully!' as status,
  'Service role key will bypass RLS automatically' as note;
