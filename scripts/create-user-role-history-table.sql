-- Create user_role_history table to track role and department changes
CREATE TABLE IF NOT EXISTS user_role_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Old values (before change)
  old_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  old_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- New values (after change)
  new_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  new_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

  -- Change metadata
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_reason TEXT,

  -- Timestamps
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON user_role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_changed_at ON user_role_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_role_history_old_role ON user_role_history(old_role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_new_role ON user_role_history(new_role_id);

-- Enable Row Level Security
ALTER TABLE user_role_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user_role_history
-- Admin and Super Admin can view all history
CREATE POLICY "Admin can view all role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND (users.access_level = 'admin' OR users.access_level = 'Super Admin')
    )
  );

-- Admin and Super Admin can insert role history
CREATE POLICY "Admin can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND (users.access_level = 'admin' OR users.access_level = 'Super Admin')
    )
  );

-- Managers can view history for users in their department
CREATE POLICY "Managers can view department role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.department_id = u2.department_id
      WHERE u1.auth_id = auth.uid()
      AND u1.access_level = 'manager'
      AND u2.id = user_role_history.user_id
    )
  );

-- Users can view their own role history
CREATE POLICY "Users can view their own role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.id = user_role_history.user_id
    )
  );

-- Add comment to table
COMMENT ON TABLE user_role_history IS 'Tracks historical changes to user roles and departments, linking to completed user_assignments for each role period';
