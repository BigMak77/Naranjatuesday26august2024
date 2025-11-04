-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'people_personal_information'
) as table_exists;

-- Check count of records without user_id
SELECT COUNT(*) as pending_count 
FROM people_personal_information 
WHERE user_id IS NULL;

-- Show all records without user_id
SELECT id, first_name, last_name, email, created_at, user_id, status
FROM people_personal_information 
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'people_personal_information';
