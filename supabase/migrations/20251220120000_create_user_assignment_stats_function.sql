-- ============================================================================
-- CREATE USER ASSIGNMENT STATS FUNCTION
-- ============================================================================
-- This function returns accurate assignment counts for all users
-- It runs with SECURITY DEFINER to bypass RLS policies
-- Counts both modules AND documents

CREATE OR REPLACE FUNCTION get_user_assignment_stats()
RETURNS TABLE (
  auth_id uuid,
  total bigint,
  completed bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    auth_id,
    COUNT(*) as total,
    COUNT(completed_at) as completed
  FROM user_assignments
  WHERE item_type IN ('module', 'document')
  GROUP BY auth_id;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_assignment_stats() TO authenticated;

COMMENT ON FUNCTION get_user_assignment_stats() IS 'Returns assignment statistics (modules + documents) for all users, bypassing RLS for accurate counts needed by trainers/admins';
