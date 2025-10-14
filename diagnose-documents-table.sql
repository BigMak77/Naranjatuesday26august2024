-- Diagnose documents table issues
-- Run this to see the current state and identify problems

-- 1. Check if the table exists and its basic structure
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'documents';

-- 2. Get all columns and their properties
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check for any constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'documents'
    AND tc.table_schema = 'public';

-- 4. Check for indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'documents'
    AND schemaname = 'public';

-- 5. Count total records and check for data issues
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN title IS NULL OR title = '' THEN 1 END) as missing_titles,
    COUNT(CASE WHEN id IS NULL THEN 1 END) as missing_ids,
    COUNT(CASE WHEN created_at IS NULL THEN 1 END) as missing_created_at
FROM documents;

-- 6. Check for duplicate titles or reference codes
SELECT 
    title,
    COUNT(*) as count
FROM documents 
WHERE title IS NOT NULL
GROUP BY title 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 7. Check reference_code duplicates (if column exists)
SELECT 
    reference_code,
    COUNT(*) as count
FROM documents 
WHERE reference_code IS NOT NULL AND reference_code != ''
GROUP BY reference_code 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 8. Check foreign key integrity issues
SELECT 
    d.id,
    d.title,
    d.section_id,
    CASE WHEN ss.id IS NULL AND d.section_id IS NOT NULL THEN 'Missing section' ELSE 'OK' END as section_status
FROM documents d
LEFT JOIN standard_sections ss ON d.section_id = ss.id
WHERE d.section_id IS NOT NULL AND ss.id IS NULL;

-- 9. Check for orphaned or problematic data
SELECT 
    'Empty titles' as issue,
    COUNT(*) as count
FROM documents 
WHERE title IS NULL OR TRIM(title) = ''
UNION ALL
SELECT 
    'Future created_at dates' as issue,
    COUNT(*) as count
FROM documents 
WHERE created_at > NOW()
UNION ALL
SELECT 
    'Invalid review periods' as issue,
    COUNT(*) as count
FROM documents 
WHERE review_period_months < 0 OR review_period_months > 120;

-- 10. Sample of actual data to see structure
SELECT 
    id,
    title,
    section_id,
    document_type_id,
    created_at,
    archived,
    reference_code
FROM documents 
ORDER BY created_at DESC 
LIMIT 10;

-- Execute: targeted-documents-cleanup.sql
