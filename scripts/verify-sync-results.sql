-- Verify sync results for role: 534b9124-d4c5-4569-ab9b-46d3f37b986c
SELECT 
    'Total assignments for this role:' as description,
    COUNT(*) as count
FROM user_assignments ua
JOIN users u ON ua.auth_id = u.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'

UNION ALL

SELECT 
    'Users with assignments:' as description,
    COUNT(DISTINCT ua.auth_id) as count
FROM user_assignments ua
JOIN users u ON ua.auth_id = u.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'

UNION ALL

SELECT 
    'Unique training items assigned:' as description,
    COUNT(DISTINCT ua.item_id) as count
FROM user_assignments ua
JOIN users u ON ua.auth_id = u.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c';

-- Individual user assignment counts
SELECT 
    u.auth_id,
    COUNT(ua.item_id) as assignment_count
FROM users u
LEFT JOIN user_assignments ua ON u.auth_id = ua.auth_id
WHERE u.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'
GROUP BY u.auth_id
ORDER BY assignment_count;
