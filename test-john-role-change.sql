-- Test John Hernandez role change logic
-- Current user: db319889-be93-49c5-a6f3-bcbbe533aaef (auth_id same as user_id)
-- Current role: 534b9124-d4c5-4569-ab9b-46d3f37b986c
-- Target role: 040cfbe5-26e1-48c0-8bbc-b8653a79a692

-- 1. John's current assignments
SELECT 
    'John current assignments:' as info,
    ua.item_id,
    ua.item_type,
    ua.assigned_at
FROM user_assignments ua
WHERE ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef'
ORDER BY ua.item_type, ua.item_id;

-- 2. What should be REMOVED (Role 1 assignments that John currently has)
SELECT 
    'Should REMOVE:' as action,
    ra.item_id,
    ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'USER_HAS_IT' ELSE 'USER_MISSING_IT' END as user_status
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'  -- Current role
ORDER BY ra.type, ra.item_id;

-- 3. What should be ADDED (Role 2 assignments that John doesn't have)
SELECT 
    'Should ADD:' as action,
    ra.item_id,
    ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'USER_ALREADY_HAS' ELSE 'WILL_BE_ADDED' END as user_status
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692'  -- Target role
ORDER BY ra.type, ra.item_id;

-- 4. Summary count
SELECT 
    (SELECT COUNT(*) FROM user_assignments WHERE auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef') as current_total,
    (SELECT COUNT(*) FROM role_assignments WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c') as role1_assignments,
    (SELECT COUNT(*) FROM role_assignments WHERE role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692') as role2_assignments;
