-- Fix RLS policies for role_assignments table
-- This table defines which modules/documents are assigned to which roles

-- Enable RLS if not already enabled
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can manage role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can insert role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can update role assignments" ON role_assignments;
DROP POLICY IF EXISTS "Admins can delete role assignments" ON role_assignments;

-- Policy 1: Anyone authenticated can view role assignments
-- This allows users to see what training is assigned to their role
CREATE POLICY "Anyone can view role assignments"
  ON role_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Admins and managers can insert role assignments
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

-- Policy 3: Admins and managers can update role assignments
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

-- Policy 4: Admins and managers can delete role assignments
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

-- Add comments
COMMENT ON POLICY "Anyone can view role assignments" ON role_assignments
  IS 'Allow all authenticated users to view role assignments';

COMMENT ON POLICY "Admins can insert role assignments" ON role_assignments
  IS 'Allow admins to create role assignments';

COMMENT ON POLICY "Admins can update role assignments" ON role_assignments
  IS 'Allow admins to update role assignments';

COMMENT ON POLICY "Admins can delete role assignments" ON role_assignments
  IS 'Allow admins to delete role assignments';

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles::text, cmd
FROM pg_policies
WHERE tablename = 'role_assignments'
ORDER BY policyname;
