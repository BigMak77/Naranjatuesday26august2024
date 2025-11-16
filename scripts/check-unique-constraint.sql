-- Check for unique constraints on documents table
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'documents'
  AND n.nspname = 'public'
  AND contype IN ('u', 'p')  -- unique or primary key
ORDER BY contype, conname;

-- Also check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'documents'
  AND schemaname = 'public'
  AND indexdef LIKE '%UNIQUE%';
