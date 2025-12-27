-- Apply user login logs migration
-- Run this in your Supabase SQL Editor

-- Create user_login_logs table to track individual login events
CREATE TABLE IF NOT EXISTS user_login_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  login_time timestamptz DEFAULT now() NOT NULL,
  ip_address inet,
  user_agent text,
  location text,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_login_logs_user_id ON user_login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_login_time ON user_login_logs(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_login_logs_email ON user_login_logs(email);

-- Enable RLS
ALTER TABLE user_login_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all login logs" ON user_login_logs;
DROP POLICY IF EXISTS "Users can view their own login logs" ON user_login_logs;

-- Create RLS policies
CREATE POLICY "Admins can view all login logs" ON user_login_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'HR Admin', 'Admin')
    )
  );

CREATE POLICY "Users can view their own login logs" ON user_login_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Create function to log user logins
CREATE OR REPLACE FUNCTION log_user_login(
  p_user_id uuid,
  p_email text,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_location text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO user_login_logs (
    user_id,
    email,
    ip_address,
    user_agent,
    location,
    success
  ) VALUES (
    p_user_id,
    p_email,
    p_ip_address,
    p_user_agent,
    p_location,
    true
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Create function to get login logs with pagination
CREATE OR REPLACE FUNCTION get_user_login_logs(
  p_limit int DEFAULT 100,
  p_offset int DEFAULT 0,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  login_time timestamptz,
  ip_address inet,
  user_agent text,
  location text,
  success boolean,
  created_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user has admin privileges or is requesting their own logs
  IF NOT (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'HR Admin', 'Admin')
    )
    OR (p_user_id IS NOT NULL AND p_user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY
  SELECT
    ull.id,
    ull.user_id,
    ull.email,
    ull.login_time,
    ull.ip_address,
    ull.user_agent,
    ull.location,
    ull.success,
    ull.created_at
  FROM user_login_logs ull
  WHERE (p_user_id IS NULL OR ull.user_id = p_user_id)
  ORDER BY ull.login_time DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_user_login TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_login_logs TO authenticated;

-- Add comments
COMMENT ON TABLE user_login_logs IS 'Tracks individual user login events';
COMMENT ON FUNCTION log_user_login IS 'Logs a user login event';
COMMENT ON FUNCTION get_user_login_logs IS 'Retrieves user login logs with pagination and permission checking';
