-- Check exact numbers for role 534b9124-d4c5-4569-ab9b-46d3f37b986c

-- 1. How many users have this role?
SELECT 'Users with this role:' as description, COUNT(*) as count
FROM users 
WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';

-- 2. How many training items are assigned to this role?
SELECT 'Training items for this role:' as description, COUNT(*) as count
FROM role_assignments 
WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';

-- 3. Current total assignments for users with this role
SELECT 'Current total assignments:' as description, COUNT(*) as count
FROM user_assignments ua
JOIN users u ON ua.auth_id = u.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';

-- 4. Expected vs actual calculation
SELECT 
    users_count * training_items as expected_total,
    current_assignments,
    (users_count * training_items - current_assignments) as difference
FROM (
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c') as users_count,
        (SELECT COUNT(*) FROM role_assignments WHERE role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c') as training_items,
        (SELECT COUNT(*) FROM user_assignments ua JOIN users u ON ua.auth_id = u.auth_id WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c') as current_assignments
) calc;

-- 5. Individual user assignment counts
SELECT 
    u.auth_id,
    COUNT(ua.item_id) as assignment_count
FROM users u
LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'
GROUP BY u.auth_id
ORDER BY assignment_count;
