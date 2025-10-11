-- Test the role change logic manually
-- This will show us exactly what should happen

-- 1. Check test user's current state
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.auth_id,
    u.role_id,
    COUNT(ua.id) as current_assignments
FROM users u
LEFT JOIN user_assignments ua ON ua.auth_id = u.auth_id
WHERE u.id = 'db319889-be93-49c5-a6f3-bcbbe533aaef'
GROUP BY u.id, u.first_name, u.last_name, u.auth_id, u.role_id;

-- 2. Show what assignments should be removed (if user has old role)
-- Replace 'USER_AUTH_ID_HERE' with the auth_id from query 1
-- Replace 'OLD_ROLE_ID_HERE' with the current role_id from query 1

SELECT 
    'Should be removed:' as action,
    ra.item_id,
    ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'EXISTS' ELSE 'NOT_FOUND' END as user_has_it
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND -- Replace with actual auth_id
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'; -- Replace with actual old role

-- 3. Show what assignments should be added (for new role)
SELECT 
    'Should be added:' as action,
    ra.item_id,
    ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'ALREADY_EXISTS' ELSE 'WILL_BE_ADDED' END as status
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND -- Replace with actual auth_id
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692'; -- New role
