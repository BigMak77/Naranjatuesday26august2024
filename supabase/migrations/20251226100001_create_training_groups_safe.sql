-- Safe migration that handles existing objects
-- Create training_groups table
CREATE TABLE IF NOT EXISTS training_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_group_members table
CREATE TABLE IF NOT EXISTS training_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES training_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create training_group_assignments table
CREATE TABLE IF NOT EXISTS training_group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES training_groups(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('module', 'document')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, item_id, item_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_group_members_group_id ON training_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_training_group_members_user_id ON training_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_training_group_assignments_group_id ON training_group_assignments(group_id);
CREATE INDEX IF NOT EXISTS idx_training_group_assignments_item ON training_group_assignments(item_id, item_type);

-- Enable RLS
ALTER TABLE training_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_group_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow authenticated users to read training groups" ON training_groups;
  DROP POLICY IF EXISTS "Allow authenticated users to manage training groups" ON training_groups;
  DROP POLICY IF EXISTS "Allow authenticated users to read group members" ON training_group_members;
  DROP POLICY IF EXISTS "Allow authenticated users to manage group members" ON training_group_members;
  DROP POLICY IF EXISTS "Allow authenticated users to read group assignments" ON training_group_assignments;
  DROP POLICY IF EXISTS "Allow authenticated users to manage group assignments" ON training_group_assignments;
END $$;

-- RLS Policies - Allow authenticated users to read all groups
CREATE POLICY "Allow authenticated users to read training groups"
  ON training_groups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage training groups"
  ON training_groups FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read group members"
  ON training_group_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage group members"
  ON training_group_members FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read group assignments"
  ON training_group_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage group assignments"
  ON training_group_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger function to sync training when members are added to a group
CREATE OR REPLACE FUNCTION sync_group_training_on_member_add()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is added to a group, assign all group's training items to the user
  INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
  SELECT
    u.auth_id,
    ga.item_id,
    ga.item_type,
    NOW()
  FROM training_group_assignments ga
  JOIN users u ON u.id = NEW.user_id
  WHERE ga.group_id = NEW.group_id
  ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS trigger_sync_group_training_on_member_add ON training_group_members;
CREATE TRIGGER trigger_sync_group_training_on_member_add
  AFTER INSERT ON training_group_members
  FOR EACH ROW
  EXECUTE FUNCTION sync_group_training_on_member_add();

-- Trigger function to sync training when assignments are added to a group
CREATE OR REPLACE FUNCTION sync_group_training_on_assignment_add()
RETURNS TRIGGER AS $$
BEGIN
  -- When an assignment is added to a group, assign it to all group members
  INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
  SELECT
    u.auth_id,
    NEW.item_id,
    NEW.item_type,
    NOW()
  FROM training_group_members gm
  JOIN users u ON u.id = gm.user_id
  WHERE gm.group_id = NEW.group_id
  ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_group_training_on_assignment_add ON training_group_assignments;
CREATE TRIGGER trigger_sync_group_training_on_assignment_add
  AFTER INSERT ON training_group_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_group_training_on_assignment_add();

-- Trigger function to remove training when member is removed from a group
CREATE OR REPLACE FUNCTION remove_group_training_on_member_remove()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user is removed from a group, remove incomplete assignments for that group's items
  -- Only remove if the assignment is not completed
  DELETE FROM user_assignments ua
  USING users u, training_group_assignments ga
  WHERE ua.auth_id = u.auth_id
    AND u.id = OLD.user_id
    AND ua.item_id = ga.item_id
    AND ua.item_type = ga.item_type
    AND ga.group_id = OLD.group_id
    AND ua.completed_at IS NULL;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_remove_group_training_on_member_remove ON training_group_members;
CREATE TRIGGER trigger_remove_group_training_on_member_remove
  BEFORE DELETE ON training_group_members
  FOR EACH ROW
  EXECUTE FUNCTION remove_group_training_on_member_remove();

-- Trigger function to remove training when assignment is removed from a group
CREATE OR REPLACE FUNCTION remove_group_training_on_assignment_remove()
RETURNS TRIGGER AS $$
BEGIN
  -- When an assignment is removed from a group, remove incomplete assignments from all group members
  DELETE FROM user_assignments ua
  USING users u, training_group_members gm
  WHERE ua.auth_id = u.auth_id
    AND u.id = gm.user_id
    AND gm.group_id = OLD.group_id
    AND ua.item_id = OLD.item_id
    AND ua.item_type = OLD.item_type
    AND ua.completed_at IS NULL;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_remove_group_training_on_assignment_remove ON training_group_assignments;
CREATE TRIGGER trigger_remove_group_training_on_assignment_remove
  BEFORE DELETE ON training_group_assignments
  FOR EACH ROW
  EXECUTE FUNCTION remove_group_training_on_assignment_remove();

-- Function to manually sync all group training assignments
CREATE OR REPLACE FUNCTION sync_all_group_training()
RETURNS void AS $$
BEGIN
  -- Sync all group assignments to all group members
  INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
  SELECT DISTINCT
    u.auth_id,
    ga.item_id,
    ga.item_type,
    NOW()
  FROM training_group_assignments ga
  JOIN training_group_members gm ON gm.group_id = ga.group_id
  JOIN users u ON u.id = gm.user_id
  ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
