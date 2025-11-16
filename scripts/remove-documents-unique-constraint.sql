-- Check and remove unique constraint on documents table that might be causing 409 errors

-- First, let's see what constraints exist
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'documents'
  AND contype = 'u';  -- unique constraints only

-- If there's a unique constraint on (reference_code, section_id), we need to drop it
-- Uncomment the line below after checking which constraint exists:
-- DROP INDEX IF EXISTS documents_reference_code_section_id_key;
-- DROP INDEX IF EXISTS idx_documents_reference_code_section_id;

-- Or if it's a constraint:
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_reference_code_section_id_key;
-- ALTER TABLE documents DROP CONSTRAINT IF EXISTS unique_reference_code_per_section;
