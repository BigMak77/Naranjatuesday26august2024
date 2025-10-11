-- Simple dump of all user_assignments data
SELECT * FROM user_assignments ORDER BY created_at DESC;

-- Count by assignment reason
SELECT assignment_reason, COUNT(*) as count 
FROM user_assignments 
GROUP BY assignment_reason 
ORDER BY count DESC;

-- Recent assignments
SELECT * FROM user_assignments 
WHERE created_at > NOW() - INTERVAL '1 day' 
ORDER BY created_at DESC;
