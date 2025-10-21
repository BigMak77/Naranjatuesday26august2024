-- SIMPLEST POSSIBLE QUERIES
-- Run these one by one to diagnose the issue

-- 1. How many assignments exist total?
SELECT COUNT(*) FROM user_assignments;

-- 2. Show me the last 10 assignments created
SELECT * FROM user_assignments ORDER BY created_at DESC LIMIT 10;

-- 3. Show me ALL assignments (be careful if there are many)
SELECT * FROM user_assignments;

-- 4. What assignment reasons exist?
SELECT DISTINCT assignment_reason FROM user_assignments;

-- 5. Check if your test user has any assignments
SELECT ua.* 
FROM user_assignments ua
JOIN auth.users au ON ua.auth_id = au.id
JOIN public.users u ON au.id = u.auth_id 
WHERE u.id = 'YOUR_USER_ID_HERE';
