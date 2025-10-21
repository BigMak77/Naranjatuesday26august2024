-- Get the detailed breakdown for John's role change
SELECT 'John current assignments:' as info, ua.item_id, ua.item_type
FROM user_assignments ua
WHERE ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef'
ORDER BY ua.item_type, ua.item_id;
