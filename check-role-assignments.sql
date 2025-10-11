-- Check role_assignments table structure
SELECT * FROM role_assignments LIMIT 5;

-- Check what columns role_assignments has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'role_assignments';

-- See if we have training_id or different columns
SELECT 
    ra.*
FROM role_assignments ra
WHERE ra.role_id IN ('534b9124-d4c5-4569-ab9b-46d3f37b986c', '040cfbe5-26e1-48c0-8bbc-b8653a79a692')
LIMIT 10;
