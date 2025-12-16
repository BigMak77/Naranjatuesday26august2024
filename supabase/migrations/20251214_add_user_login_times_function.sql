-- Create a function to get user login times from auth.users
-- This is necessary because auth.users is not directly accessible with anon key

CREATE OR REPLACE FUNCTION get_user_login_times()
RETURNS TABLE (
  id uuid,
  email text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only allow authenticated users to call this function
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Optionally: Add role check to restrict to admins only
  -- IF NOT EXISTS (
  --   SELECT 1 FROM user_roles
  --   WHERE user_id = auth.uid() AND role = 'admin'
  -- ) THEN
  --   RAISE EXCEPTION 'Insufficient permissions';
  -- END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::text,
    au.last_sign_in_at,
    au.created_at
  FROM auth.users au
  ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_login_times() TO authenticated;

COMMENT ON FUNCTION get_user_login_times() IS 'Returns user login information including last sign-in time from auth.users table';
