-- Fix for duplicate role history entries
-- Solution: Disable the automatic trigger since the application handles history tracking manually

-- Drop the existing trigger (keep the function in case needed later)
DROP TRIGGER IF EXISTS user_role_change_trigger ON users;

-- Optionally drop the function too if you want a complete cleanup
-- DROP FUNCTION IF EXISTS log_user_role_change();

-- Clean up any duplicate entries (optional - only if you want to remove existing duplicates)
-- This will keep only the entry with changed_by populated (the manual one) and remove the system-generated duplicate
-- Comment out if you want to keep historical duplicates

WITH duplicates AS (
  SELECT
    user_id,
    old_role_id,
    new_role_id,
    changed_at::DATE as change_date,
    MIN(id) FILTER (WHERE changed_by IS NOT NULL) as keep_id,
    MAX(id) FILTER (WHERE changed_by IS NULL) as delete_id
  FROM user_role_history
  GROUP BY user_id, old_role_id, new_role_id, changed_at::DATE
  HAVING COUNT(*) > 1
)
DELETE FROM user_role_history
WHERE id IN (SELECT delete_id FROM duplicates WHERE delete_id IS NOT NULL);

-- Add comment
COMMENT ON TABLE user_role_history IS 'Manual role change tracking - trigger disabled to prevent duplicates. Application inserts records directly.';
