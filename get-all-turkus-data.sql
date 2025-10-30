-- SQL to show all turkus tables and their column structures

-- Get all turkus table names and their columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name LIKE 'turkus%'
ORDER BY table_name, ordinal_position;
