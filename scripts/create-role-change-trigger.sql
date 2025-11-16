-- Create a trigger function to automatically log role/department changes
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

-- Create the trigger on the users table
DROP TRIGGER IF EXISTS user_role_change_trigger ON users;

CREATE TRIGGER user_role_change_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id OR OLD.department_id IS DISTINCT FROM NEW.department_id)
  EXECUTE FUNCTION log_user_role_change();

-- Add comment to the trigger
COMMENT ON TRIGGER user_role_change_trigger ON users IS 'Automatically logs role and department changes to user_role_history table';

COMMENT ON FUNCTION log_user_role_change IS 'Trigger function that creates a history entry when a user''s role or department changes';
