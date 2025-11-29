-- Function to sync department training assignments to a user when they join a department
CREATE OR REPLACE FUNCTION sync_department_training_to_user()
RETURNS TRIGGER AS $$
DECLARE
  dept_id UUID;
  assignment_record RECORD;
BEGIN
  -- Skip if user has no auth_id
  IF NEW.auth_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get the department_id from the user's role
  SELECT department_id INTO dept_id
  FROM roles
  WHERE id = NEW.role_id;

  -- If no department found, exit
  IF dept_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get all department assignments for this department
  FOR assignment_record IN
    SELECT id, item_id, type
    FROM department_assignments
    WHERE department_id = dept_id
  LOOP
    -- Insert user assignment if it doesn't already exist
    INSERT INTO user_assignments (auth_id, assignment_id, item_id, item_type, due_at)
    VALUES (NEW.auth_id, assignment_record.id, assignment_record.item_id, assignment_record.type, NOW())
    ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync department training when a user is inserted
CREATE TRIGGER trigger_sync_department_training_on_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_department_training_to_user();

-- Trigger to sync department training when a user's role changes
CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF role_id ON users
FOR EACH ROW
WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
EXECUTE FUNCTION sync_department_training_to_user();

-- Function to sync new department assignments to all users in that department
CREATE OR REPLACE FUNCTION sync_new_department_assignment_to_users()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  role_record RECORD;
BEGIN
  -- For each role in this department
  FOR role_record IN
    SELECT id FROM roles WHERE department_id = NEW.department_id
  LOOP
    -- For each user with this role (only those with valid auth_id)
    FOR user_record IN
      SELECT auth_id FROM users WHERE role_id = role_record.id AND auth_id IS NOT NULL
    LOOP
      -- Insert user assignment if it doesn't already exist
      -- NEW.id is the department_assignments.id that was just inserted
      INSERT INTO user_assignments (auth_id, assignment_id, item_id, item_type, due_at)
      VALUES (user_record.auth_id, NEW.id, NEW.item_id, NEW.type, NOW())
      ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
    END LOOP;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync department assignments when new training is added to a department
CREATE TRIGGER trigger_sync_new_department_assignment
AFTER INSERT ON department_assignments
FOR EACH ROW
EXECUTE FUNCTION sync_new_department_assignment_to_users();

-- Add comments
COMMENT ON FUNCTION sync_department_training_to_user() IS 'Automatically assigns department-level training to users when they join or change departments';
COMMENT ON FUNCTION sync_new_department_assignment_to_users() IS 'Automatically assigns new department training to all existing users in that department';
