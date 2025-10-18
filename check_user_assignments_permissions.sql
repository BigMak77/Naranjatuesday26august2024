-- Check user_assignments table structure and constraints
-- This will show you column names, data types, and if they allow NULL values

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'user_assignments'
ORDER BY
    ordinal_position;

-- Check for any constraints on the table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM
    pg_constraint
WHERE
    conrelid = 'public.user_assignments'::regclass;

-- Check indexes on the table
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = 'user_assignments';

-- Check RLS (Row Level Security) policies
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'user_assignments';
