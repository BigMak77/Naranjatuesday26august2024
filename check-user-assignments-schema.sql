-- Check user_assignments table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_assignments'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'user_assignments'
  AND nsp.nspname = 'public';

-- Sample data (first 5 rows)
SELECT * FROM user_assignments LIMIT 5;
