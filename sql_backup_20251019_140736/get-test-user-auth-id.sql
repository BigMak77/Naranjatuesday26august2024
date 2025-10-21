-- Get test user's auth_id for manual testing
SELECT 
    id,
    first_name,
    last_name,
    auth_id,
    role_id
FROM users 
WHERE id = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
