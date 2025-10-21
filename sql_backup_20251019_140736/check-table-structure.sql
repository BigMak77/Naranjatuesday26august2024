-- Check the actual table structure
DESCRIBE user_assignments;

-- OR try this if DESCRIBE doesn't work
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_assignments';

-- Check what item_types exist
SELECT item_type, COUNT(*) as count
FROM user_assignments 
GROUP BY item_type 
ORDER BY count DESC;

-- Show sample data with readable info
SELECT 
    ua.id,
    ua.auth_id,
    ua.item_id,
    ua.item_type,
    ua.assigned_at,
    -- Try to join with users
    u.first_name,
    u.last_name,
    u.email
FROM user_assignments ua
LEFT JOIN auth.users au ON ua.auth_id = au.id
LEFT JOIN public.users pu ON au.id = pu.auth_id
LEFT JOIN public.users u ON pu.id = u.id
LIMIT 10;
