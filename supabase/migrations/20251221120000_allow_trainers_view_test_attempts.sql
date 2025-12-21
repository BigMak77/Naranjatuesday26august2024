-- ============================================================================
-- ALLOW TRAINERS TO VIEW TEST ATTEMPTS
-- ============================================================================
-- This migration adds RLS policies to allow trainers and admins to view
-- test attempts for all users, not just their own.
-- ============================================================================

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own test attempts" ON test_attempts;

-- Recreate the policy for users to view their own attempts
CREATE POLICY "Users can view own test attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Add policy for trainers to view all test attempts
CREATE POLICY "Trainers can view all test attempts"
  ON test_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
        AND users.access_level IN ('trainer', 'admin', 'superadmin')
    )
  );

COMMENT ON POLICY "Trainers can view all test attempts" ON test_attempts IS
'Allows trainers and admins to view test attempts for all users for training management purposes';
