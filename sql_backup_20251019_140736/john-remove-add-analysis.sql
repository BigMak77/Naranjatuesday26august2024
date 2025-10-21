-- What should be removed vs added for John
SELECT 'Should REMOVE:' as action, ra.item_id, ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'USER_HAS_IT' ELSE 'USER_MISSING_IT' END as user_status
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '534b9124-d4c5-4569-ab9b-46d3f37b986c'
UNION ALL
SELECT 'Should ADD:' as action, ra.item_id, ra.type,
    CASE WHEN ua.id IS NOT NULL THEN 'USER_ALREADY_HAS' ELSE 'WILL_BE_ADDED' END as user_status
FROM role_assignments ra
LEFT JOIN user_assignments ua ON (
    ua.auth_id = 'db319889-be93-49c5-a6f3-bcbbe533aaef' AND
    ua.item_id = ra.item_id AND 
    ua.item_type = ra.type
)
WHERE ra.role_id = '040cfbe5-26e1-48c0-8bbc-b8653a79a692'
ORDER BY action, type, item_id;
