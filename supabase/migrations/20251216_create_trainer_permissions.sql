-- Create user_view_permissions table to store which departments and shifts users can view
-- This applies to Managers, Trainers, and any other roles that need restricted access
CREATE TABLE IF NOT EXISTS user_view_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift_patterns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, department_id, shift_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_view_permissions_user_id ON user_view_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_view_permissions_department_id ON user_view_permissions(department_id);
CREATE INDEX IF NOT EXISTS idx_user_view_permissions_shift_id ON user_view_permissions(shift_id);

-- Add RLS policies
ALTER TABLE user_view_permissions ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read their own permissions
CREATE POLICY "Allow users to read view permissions"
  ON user_view_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow HR Admins and Super Admins to insert permissions
CREATE POLICY "Allow admins to insert view permissions"
  ON user_view_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'HR Admin', 'Admin')
    )
  );

-- Allow HR Admins and Super Admins to update permissions
CREATE POLICY "Allow admins to update view permissions"
  ON user_view_permissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'HR Admin', 'Admin')
    )
  );

-- Allow HR Admins and Super Admins to delete permissions
CREATE POLICY "Allow admins to delete view permissions"
  ON user_view_permissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.access_level IN ('Super Admin', 'HR Admin', 'Admin')
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_view_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_view_permissions_updated_at
  BEFORE UPDATE ON user_view_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_view_permissions_updated_at();
