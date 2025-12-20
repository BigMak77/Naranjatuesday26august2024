-- Function to sync role training assignments to a user when they are assigned a role
CREATE OR REPLACE FUNCTION sync_role_training_to_user()
RETURNS TRIGGER AS $$
DECLARE
  assignment_record RECORD;
BEGIN
  -- Skip if user has no auth_id
  IF NEW.auth_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if user has no role_id
  IF NEW.role_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get all role assignments for this role
  FOR assignment_record IN
    SELECT item_id, type
    FROM role_assignments
    WHERE role_id = NEW.role_id
  LOOP
    -- Insert user assignment if it doesn't already exist
    INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
    VALUES (NEW.auth_id, assignment_record.item_id, assignment_record.type, NOW())
    ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync role training when a user is inserted
CREATE TRIGGER trigger_sync_role_training_on_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_role_training_to_user();

-- Trigger to sync role training when a user's role changes
CREATE TRIGGER trigger_sync_role_training_on_update
AFTER UPDATE OF role_id ON users
FOR EACH ROW
WHEN (OLD.role_id IS DISTINCT FROM NEW.role_id)
EXECUTE FUNCTION sync_role_training_to_user();

-- Function to sync new role assignments to all users with that role
CREATE OR REPLACE FUNCTION sync_new_role_assignment_to_users()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- For each user with this role (only those with valid auth_id)
  FOR user_record IN
    SELECT auth_id FROM users WHERE role_id = NEW.role_id AND auth_id IS NOT NULL
  LOOP
    -- Insert user assignment if it doesn't already exist
    INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
    VALUES (user_record.auth_id, NEW.item_id, NEW.type, NOW())
    ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync role assignments when new training is added to a role
CREATE TRIGGER trigger_sync_new_role_assignment
AFTER INSERT ON role_assignments
FOR EACH ROW
EXECUTE FUNCTION sync_new_role_assignment_to_users();

-- Add comments
COMMENT ON FUNCTION sync_role_training_to_user() IS 'Automatically assigns role-level training to users when they join or change roles';
COMMENT ON FUNCTION sync_new_role_assignment_to_users() IS 'Automatically assigns new role training to all existing users with that role';
