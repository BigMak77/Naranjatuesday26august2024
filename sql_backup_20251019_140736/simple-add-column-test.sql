-- Simple test: Just add the column first to see if it works
ALTER TABLE user_assignments ADD COLUMN role_assignment_id UUID;

-- Test query
SELECT COUNT(*) as total_assignments FROM user_assignments;
SELECT COUNT(*) as assignments_with_role_assignment_id 
FROM user_assignments 
WHERE role_assignment_id IS NOT NULL;
