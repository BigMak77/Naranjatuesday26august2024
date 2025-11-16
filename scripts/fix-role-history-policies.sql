-- Fix RLS policies for user_role_history to allow viewing

-- Drop all existing policies
DROP POLICY IF EXISTS "Admin can view all role history" ON user_role_history;
DROP POLICY IF EXISTS "Admin can insert role history" ON user_role_history;
DROP POLICY IF EXISTS "Managers can view department role history" ON user_role_history;
DROP POLICY IF EXISTS "Users can view their own role history" ON user_role_history;

-- Create a simple policy that allows all authenticated users to view role history
CREATE POLICY "Authenticated users can view role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow the trigger to insert without authentication (system operation)
CREATE POLICY "System can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Comment on the policies
COMMENT ON POLICY "Authenticated users can view role history" ON user_role_history IS 'Allow all authenticated users to view role history';
COMMENT ON POLICY "System can insert role history" ON user_role_history IS 'Allow system triggers to insert role history records';
