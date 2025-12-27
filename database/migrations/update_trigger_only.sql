-- Quick fix: Just recreate the function without updated_at
-- Run this if you already have the trigger but it has the wrong code

DROP FUNCTION IF EXISTS sync_first_aid_flag() CASCADE;

CREATE OR REPLACE FUNCTION sync_first_aid_flag()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  first_aid_module_id UUID := 'f1236b6b-ee01-4e68-9082-e2380b0fa600';
  affected_auth_id UUID;
BEGIN
  -- Determine which auth_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_auth_id := OLD.auth_id;
  ELSE
    affected_auth_id := NEW.auth_id;
  END IF;

  -- Only process if this is a first aid module assignment
  IF (TG_OP = 'DELETE' AND OLD.item_type = 'module' AND OLD.item_id = first_aid_module_id) OR
     (TG_OP IN ('INSERT', 'UPDATE') AND NEW.item_type = 'module' AND NEW.item_id = first_aid_module_id) THEN

    RAISE NOTICE 'First aid sync triggered: % for auth_id %', TG_OP, affected_auth_id;

    IF TG_OP = 'DELETE' THEN
      UPDATE users
      SET is_first_aid = false
      WHERE auth_id = affected_auth_id;

      RAISE NOTICE 'Removed first aid flag for user with auth_id: %', affected_auth_id;

    ELSIF TG_OP IN ('INSERT', 'UPDATE') THEN
      UPDATE users
      SET is_first_aid = true
      WHERE auth_id = affected_auth_id;

      RAISE NOTICE 'Set first aid flag for user with auth_id: %', affected_auth_id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER sync_first_aid_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_first_aid_flag();

DO $$
BEGIN
  RAISE NOTICE 'Trigger function updated successfully - no more updated_at references';
END $$;
