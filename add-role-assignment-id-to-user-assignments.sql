-- Migration: Add role_assignment_id column to user_assignments table
-- This will allow us to track which role_assignment created each user_assignment
-- and properly handle role changes without duplicate assignments

BEGIN;

-- 1. Add the role_assignment_id column (nullable initially)
ALTER TABLE user_assignments ADD COLUMN role_assignment_id UUID;

-- 2. Add foreign key constraint to role_assignments table
ALTER TABLE user_assignments 
ADD CONSTRAINT fk_user_assignments_role_assignment 
FOREIGN KEY (role_assignment_id) REFERENCES role_assignments(id) ON DELETE CASCADE;

-- 3. Create index for performance
CREATE INDEX idx_user_assignments_role_assignment_id ON user_assignments(role_assignment_id);

-- 4. Try to backfill existing data by matching item_id and item_type
UPDATE user_assignments 
SET role_assignment_id = (
  SELECT ra.id 
  FROM role_assignments ra 
  WHERE COALESCE(ra.document_id, ra.module_id) = user_assignments.item_id 
    AND ra.type = user_assignments.item_type
  LIMIT 1
)
WHERE role_assignment_id IS NULL;

-- 5. Check results
SELECT 
  COUNT(*) as total_assignments,
  COUNT(role_assignment_id) as assignments_with_role_assignment_id,
  COUNT(*) - COUNT(role_assignment_id) as assignments_missing_role_assignment_id
FROM user_assignments;

-- 6. Show any assignments that couldn't be matched
SELECT 
  ua.id,
  ua.auth_id,
  ua.item_id,
  ua.item_type,
  ua.assigned_at
FROM user_assignments ua
WHERE ua.role_assignment_id IS NULL
LIMIT 10;

COMMIT;

-- Note: After running this migration, you should:
-- 1. Verify the backfill worked correctly
-- 2. Clean up any orphaned assignments that couldn't be matched
-- 3. Consider making role_assignment_id NOT NULL in a future migration
