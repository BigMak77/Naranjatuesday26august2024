-- Get all columns from the users table with their data types and constraints
-- Run this in Supabase SQL Editor

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM
  information_schema.columns
WHERE
  table_schema = 'public'
  AND table_name = 'users'
ORDER BY
  ordinal_position;
