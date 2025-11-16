-- Fix RLS policy for user_role_history to allow authenticated users to insert
-- This allows the DepartmentRoleManager component to insert role history records

-- Drop the old system policy
DROP POLICY IF EXISTS "System can insert role history" ON user_role_history;

-- Create a policy that allows authenticated users to insert role history
CREATE POLICY "Authenticated users can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Comment on the policy
COMMENT ON POLICY "Authenticated users can insert role history" ON user_role_history
  IS 'Allow authenticated users to insert role history records when changing departments/roles';

-- Verify the policies are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_role_history';
