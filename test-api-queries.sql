-- Test the exact queries the API should run

-- 1. Get old role assignments (what API does first)
SELECT 'Old role assignments:' as step, item_id, type
FROM role_assignments 
WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';

-- 2. For each old assignment, check if user has it (what API does in loop)
-- Test first assignment: 095cc86c-46e4-4888-afc8-651392a6ec28 (document)
SELECT 'User has first assignment?' as test, COUNT(*) as count
FROM user_assignments 
WHERE auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' 
  AND item_id = '095cc86c-46e4-4888-afc8-651392a6ec28' 
  AND item_type = 'document';

-- 3. Test all old assignments at once
SELECT 'All old assignments user has:' as test, 
  ra.item_id, ra.type, 
  CASE WHEN ua.id IS NOT NULL THEN 'FOUND' ELSE 'NOT_FOUND' END as user_has_it
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
  ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND
  ua.item_id = ra.item_id AND 
  ua.item_type = ra.type
)
WHERE ra.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'
ORDER BY ra.type, ra.item_id;
