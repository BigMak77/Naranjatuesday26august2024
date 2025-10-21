-- Simple check: Do your test roles have any role_assignments?
SELECT 
    ra.role_id,
    COUNT(*) as assignment_count
FROM role_assignments ra
WHERE ra.role_id IN ('534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692')
GROUP BY ra.role_id;

-- What columns does role_assignments actually have?
SELECT * FROM role_assignments LIMIT 3;
