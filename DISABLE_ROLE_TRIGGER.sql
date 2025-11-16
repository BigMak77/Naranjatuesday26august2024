-- Disable the automatic trigger to prevent duplicate role history entries
-- Run this in the Supabase SQL Editor

DROP TRIGGER IF EXISTS user_role_change_trigger ON users;

-- Optionally, you can also drop the function if you don't need it anymore:
-- DROP FUNCTION IF EXISTS log_user_role_change();

-- Verify trigger was dropped
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'user_role_change_trigger';

-- Expected result: Empty (no rows) means trigger was successfully dropped
