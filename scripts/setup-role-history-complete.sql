-- Complete setup for user role history tracking
-- Run this entire file in Supabase SQL Editor

-- Step 1: Create the user_role_history table
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

-- Step 2: Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_role_history_user_id ON user_role_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_changed_at ON user_role_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_role_history_old_role ON user_role_history(old_role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_history_new_role ON user_role_history(new_role_id);

-- Step 3: Enable Row Level Security
ALTER TABLE user_role_history ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all role history" ON user_role_history;
DROP POLICY IF EXISTS "Admin can insert role history" ON user_role_history;
DROP POLICY IF EXISTS "Managers can view department role history" ON user_role_history;
DROP POLICY IF EXISTS "Users can view their own role history" ON user_role_history;

-- Step 5: Create RLS policies
CREATE POLICY "Admin can view all role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND (users.access_level = 'Admin' OR users.access_level = 'Super Admin')
    )
  );

CREATE POLICY "Admin can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND (users.access_level = 'Admin' OR users.access_level = 'Super Admin')
    )
  );

CREATE POLICY "Managers can view department role history" ON user_role_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u1
      JOIN users u2 ON u1.department_id = u2.department_id
      WHERE u1.auth_id = auth.uid()
      AND u1.access_level = 'Manager'
      AND u2.id = user_role_history.user_id
    )
  );

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

-- Step 6: Create trigger function
CREATE OR REPLACE FUNCTION log_user_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if role_id or department_id has actually changed
  IF (OLD.role_id IS DISTINCT FROM NEW.role_id) OR (OLD.department_id IS DISTINCT FROM NEW.department_id) THEN
    INSERT INTO user_role_history (
      user_id,
      old_role_id,
      old_department_id,
      new_role_id,
      new_department_id,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.role_id,
      OLD.department_id,
      NEW.role_id,
      NEW.department_id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create the trigger
DROP TRIGGER IF EXISTS user_role_change_trigger ON users;

CREATE TRIGGER user_role_change_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id OR OLD.department_id IS DISTINCT FROM NEW.department_id)
  EXECUTE FUNCTION log_user_role_change();

-- Step 8: Add comments
COMMENT ON TABLE user_role_history IS 'Tracks historical changes to user roles and departments, automatically logged via trigger';
COMMENT ON TRIGGER user_role_change_trigger ON users IS 'Automatically logs role and department changes to user_role_history table';
COMMENT ON FUNCTION log_user_role_change IS 'Trigger function that creates a history entry when a user''s role or department changes';
