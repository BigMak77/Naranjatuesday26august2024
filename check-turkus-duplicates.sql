-- Pre-migration analysis: Check for duplicates in existing turkus tables
-- Run this BEFORE running the main migration to understand your data

-- 1. Check for duplicate risk assignments
SELECT 
    'turkus_risk_assignments' as table_name,
    'Duplicate risk assignments' as issue_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT (risk_id, auth_id)) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT (risk_id, auth_id)) as duplicate_count
FROM turkus_risk_assignments
WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL;

-- 2. Show specific duplicate risk assignments
SELECT 
    risk_id,
    auth_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY assigned_at DESC NULLS LAST) as all_ids,
    array_agg(assigned_at ORDER BY assigned_at DESC NULLS LAST) as all_dates
FROM turkus_risk_assignments
WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL
GROUP BY risk_id, auth_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 3. Check for duplicate task assignments
SELECT 
    'turkus_assignments' as table_name,
    'Duplicate task assignments' as issue_type,
    COUNT(*) as total_records,
    COUNT(DISTINCT (task_id, user_auth_id)) as unique_combinations,
    COUNT(*) - COUNT(DISTINCT (task_id, user_auth_id)) as duplicate_count
FROM turkus_assignments
WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL;

-- 4. Show specific duplicate task assignments
SELECT 
    task_id,
    user_auth_id,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at DESC NULLS LAST) as all_ids,
    array_agg(created_at ORDER BY created_at DESC NULLS LAST) as all_dates
FROM turkus_assignments
WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
GROUP BY task_id, user_auth_id
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- 5. Check data quality issues
SELECT 
    'Data Quality Issues' as analysis_type,
    'Risk assignments with NULL values' as issue,
    COUNT(*) as count
FROM turkus_risk_assignments
WHERE risk_id IS NULL OR auth_id IS NULL
UNION ALL
SELECT 
    'Data Quality Issues' as analysis_type,
    'Task assignments with NULL values' as issue,
    COUNT(*) as count
FROM turkus_assignments
WHERE task_id IS NULL OR user_auth_id IS NULL;

-- 6. Summary report
SELECT 
    'MIGRATION SUMMARY' as report_section,
    'Total records to migrate' as metric,
    (
        SELECT COUNT(*) FROM turkus_risk_assignments WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL
    ) + (
        SELECT COUNT(*) FROM turkus_assignments WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
    ) as value
UNION ALL
SELECT 
    'MIGRATION SUMMARY' as report_section,
    'Unique records after deduplication' as metric,
    (
        SELECT COUNT(DISTINCT (risk_id, auth_id)) FROM turkus_risk_assignments WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL
    ) + (
        SELECT COUNT(DISTINCT (task_id, user_auth_id)) FROM turkus_assignments WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
    ) as value;

-- 7. Recommendation
SELECT 
    'RECOMMENDATION' as section,
    CASE 
        WHEN (
            SELECT COUNT(*) - COUNT(DISTINCT (risk_id, auth_id)) 
            FROM turkus_risk_assignments 
            WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL
        ) + (
            SELECT COUNT(*) - COUNT(DISTINCT (task_id, user_auth_id)) 
            FROM turkus_assignments 
            WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
        ) > 0 
        THEN 'DUPLICATES FOUND: The migration script will automatically handle duplicates by keeping the most recent assignment per user/item combination.'
        ELSE 'NO DUPLICATES: Migration should proceed without issues.'
    END as message;
