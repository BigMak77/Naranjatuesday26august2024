-- Automatically set auth_id = id for new users if not provided
-- This ensures module inheritance triggers work immediately

CREATE OR REPLACE FUNCTION auto_set_auth_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If auth_id is not set, use the user's id
  IF NEW.auth_id IS NULL THEN
    NEW.auth_id := NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set auth_id on INSERT
CREATE TRIGGER trigger_auto_set_auth_id
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION auto_set_auth_id();

COMMENT ON FUNCTION auto_set_auth_id() IS
'Automatically sets auth_id = id for new users if auth_id is not provided.
This ensures module inheritance triggers can assign training immediately.';
