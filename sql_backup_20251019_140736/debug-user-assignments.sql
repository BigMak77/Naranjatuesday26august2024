-- Complete User Assignments Analysis
-- Run this to see everything in user_assignments table

-- 1. Show all user_assignments with readable info
SELECT 
    ua.id,
    ua.auth_id,
    ua.training_id,
    ua.assignment_reason,
    ua.assigned_at,
    ua.created_at,
    -- Join with users to get user info
    u.first_name,
    u.last_name,
    u.email,
    u.role_id as current_user_role,
    -- Join with roles to get role info
    r.title as current_role_title,
    -- Join with training to get training info
    t.title as training_title,
    t.training_type
FROM user_assignments ua
LEFT JOIN auth.users au ON ua.auth_id = au.id
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.roles r ON u.role_id = r.id
LEFT JOIN public.training t ON ua.training_id = t.id
ORDER BY ua.created_at DESC;

-- 2. Count assignments by user
SELECT 
    u.first_name || ' ' || u.last_name as user_name,
    u.email,
    u.role_id,
    r.title as role_title,
    COUNT(ua.id) as assignment_count
FROM public.users u
LEFT JOIN auth.users au ON u.auth_id = au.id
LEFT JOIN user_assignments ua ON ua.auth_id = au.id
LEFT JOIN public.roles r ON u.role_id = r.id
GROUP BY u.id, u.first_name, u.last_name, u.email, u.role_id, r.title
ORDER BY assignment_count DESC;

-- 3. Count assignments by role
SELECT 
    r.title as role_title,
    r.id as role_id,
    COUNT(DISTINCT ua.id) as assignment_count,
    COUNT(DISTINCT u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON u.role_id = r.id
LEFT JOIN auth.users au ON u.auth_id = au.id
LEFT JOIN user_assignments ua ON ua.auth_id = au.id
GROUP BY r.id, r.title
ORDER BY assignment_count DESC;

-- 4. Show recent assignment activity
SELECT 
    ua.assignment_reason,
    ua.assigned_at,
    ua.created_at,
    u.first_name || ' ' || u.last_name as user_name,
    t.title as training_title,
    r.title as current_role
FROM user_assignments ua
LEFT JOIN auth.users au ON ua.auth_id = au.id
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.training t ON ua.training_id = t.id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE ua.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ua.created_at DESC;

-- 5. Check for your specific test user
SELECT 
    ua.*,
    u.first_name,
    u.last_name,
    u.email,
    u.role_id,
    r.title as role_title
FROM user_assignments ua
LEFT JOIN auth.users au ON ua.auth_id = au.id
LEFT JOIN public.users u ON au.id = u.auth_id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'db319889-be93-49c5-a6f3-bcbbe533aaef'
ORDER BY ua.created_at DESC;

-- 6. Check orphaned assignments (assignments without valid users)
SELECT 
    ua.id,
    ua.auth_id,
    ua.training_id,
    ua.assignment_reason,
    ua.created_at,
    CASE 
        WHEN au.id IS NULL THEN 'No auth user'
        WHEN u.id IS NULL THEN 'No public user'
        ELSE 'Valid'
    END as status
FROM user_assignments ua
LEFT JOIN auth.users au ON ua.auth_id = au.id
LEFT JOIN public.users u ON au.id = u.auth_id
WHERE au.id IS NULL OR u.id IS NULL;

-- 7. Simple count of all assignments
SELECT COUNT(*) as total_assignments FROM user_assignments;

-- 8. Check if the test user exists and has auth_id
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.auth_id,
    u.role_id,
    r.title as role_title,
    CASE 
        WHEN u.auth_id IS NULL THEN 'Missing auth_id'
        WHEN au.id IS NULL THEN 'Invalid auth_id'
        ELSE 'Valid auth_id'
    END as auth_status
FROM public.users u
LEFT JOIN auth.users au ON u.auth_id = au.id
LEFT JOIN public.roles r ON u.role_id = r.id
WHERE u.id = 'db319889-be93-49c5-a6f3-bcbbe533aaef';

-- 9. Check role assignments for test roles
SELECT 
    ra.role_id,
    r.title as role_title,
    ra.training_id,
    t.title as training_title,
    ra.created_at
FROM role_assignments ra
LEFT JOIN public.roles r ON ra.role_id = r.id
LEFT JOIN public.training t ON ra.training_id = t.id
WHERE ra.role_id IN ('534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692')
ORDER BY ra.role_id, ra.created_at;
