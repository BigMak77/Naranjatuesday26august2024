-- ============================================================================
-- COMPREHENSIVE TABLE AUDIT - SUPABASE DATABASE
-- ============================================================================
-- This script analyzes all tables in your database to identify:
-- 1. All tables and their sizes
-- 2. Tables with no data (potentially unused)
-- 3. Tables with no foreign key relationships (orphaned)
-- 4. Tables with no indexes (performance issues)
-- 5. Duplicate or redundant table structures
-- 6. Tables referenced by triggers
-- 7. Tables referenced by application code patterns
-- ============================================================================

-- ============================================================================
-- PART 1: ALL TABLES - COMPLETE INVENTORY
-- ============================================================================

SELECT
    'ALL TABLES' as section,
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as data_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- PART 2: TABLE ROW COUNTS
-- ============================================================================
-- Shows how many rows are in each table (identifies empty tables)

DO $$
DECLARE
    v_table_record RECORD;
    v_row_count BIGINT;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'TABLE ROW COUNTS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Format: Table Name | Row Count | Status';
    RAISE NOTICE '------------------------------------------------------------';

    FOR v_table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', v_table_record.tablename) INTO v_row_count;

        IF v_row_count = 0 THEN
            RAISE NOTICE '% | % rows | ⚠️  EMPTY TABLE',
                RPAD(v_table_record.tablename, 40),
                LPAD(v_row_count::TEXT, 8);
        ELSIF v_row_count < 10 THEN
            RAISE NOTICE '% | % rows | Low usage',
                RPAD(v_table_record.tablename, 40),
                LPAD(v_row_count::TEXT, 8);
        ELSE
            RAISE NOTICE '% | % rows | ✓',
                RPAD(v_table_record.tablename, 40),
                LPAD(v_row_count::TEXT, 8);
        END IF;
    END LOOP;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 3: FOREIGN KEY RELATIONSHIPS
-- ============================================================================
-- Shows which tables are connected to each other

SELECT
    'FOREIGN KEY RELATIONSHIPS' as section,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- PART 4: ORPHANED TABLES (No foreign keys IN or OUT)
-- ============================================================================
-- Tables that have no relationships with other tables

WITH tables_with_fk AS (
    SELECT DISTINCT table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'public'
    UNION
    SELECT DISTINCT ccu.table_name
    FROM information_schema.constraint_column_usage ccu
    JOIN information_schema.table_constraints tc
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_schema = 'public'
)
SELECT
    'ORPHANED TABLES' as section,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size,
    'No foreign key relationships' as status
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT IN (SELECT table_name FROM tables_with_fk)
ORDER BY tablename;

-- ============================================================================
-- PART 5: TABLES WITH NO INDEXES (PERFORMANCE RISK)
-- ============================================================================

WITH indexed_tables AS (
    SELECT DISTINCT tablename
    FROM pg_indexes
    WHERE schemaname = 'public'
)
SELECT
    'TABLES WITHOUT INDEXES' as section,
    tablename as table_name,
    '⚠️  No indexes - performance risk for queries' as warning
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT IN (SELECT tablename FROM indexed_tables)
ORDER BY tablename;

-- ============================================================================
-- PART 6: DUPLICATE COLUMN PATTERNS (POTENTIALLY REDUNDANT TABLES)
-- ============================================================================
-- Identifies tables with similar column structures

WITH table_columns AS (
    SELECT
        table_name,
        STRING_AGG(column_name || ':' || data_type, ', ' ORDER BY ordinal_position) as column_signature,
        COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    GROUP BY table_name
)
SELECT
    'SIMILAR TABLE STRUCTURES' as section,
    t1.table_name as table_1,
    t2.table_name as table_2,
    t1.column_count as num_columns,
    CASE
        WHEN t1.column_signature = t2.column_signature THEN 'IDENTICAL STRUCTURE ⚠️'
        ELSE 'Similar structure'
    END as similarity
FROM table_columns t1
JOIN table_columns t2
    ON t1.column_count = t2.column_count
    AND t1.table_name < t2.table_name
    AND (
        t1.column_signature = t2.column_signature
        OR t1.table_name LIKE t2.table_name || '%'
        OR t2.table_name LIKE t1.table_name || '%'
    )
ORDER BY similarity DESC, table_1;

-- ============================================================================
-- PART 7: TABLES REFERENCED BY TRIGGERS
-- ============================================================================
-- Shows which tables have triggers (actively used)

SELECT DISTINCT
    'TABLES WITH TRIGGERS' as section,
    c.relname as table_name,
    COUNT(t.tgname) as trigger_count,
    STRING_AGG(t.tgname, ', ') as trigger_names
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
GROUP BY c.relname
ORDER BY trigger_count DESC, c.relname;

-- ============================================================================
-- PART 8: TABLES NEVER REFERENCED BY TRIGGERS OR FOREIGN KEYS
-- ============================================================================
-- Potentially unused tables

WITH active_tables AS (
    -- Tables with triggers
    SELECT DISTINCT c.relname as table_name
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE NOT t.tgisinternal AND n.nspname = 'public'

    UNION

    -- Tables with foreign keys
    SELECT DISTINCT table_name
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'

    UNION

    -- Tables referenced by foreign keys
    SELECT DISTINCT ccu.table_name
    FROM information_schema.constraint_column_usage ccu
    JOIN information_schema.table_constraints tc
        ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_schema = 'public'
)
SELECT
    'POTENTIALLY UNUSED TABLES' as section,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size('public.' || tablename)) as size,
    'No triggers or foreign keys - may be unused' as note
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT IN (SELECT table_name FROM active_tables)
ORDER BY pg_total_relation_size('public.' || tablename) DESC;

-- ============================================================================
-- PART 9: TABLES WITH CREATED_AT/UPDATED_AT COLUMNS
-- ============================================================================
-- Identifies tables following standard patterns

SELECT
    'TABLES WITH TIMESTAMP COLUMNS' as section,
    table_name,
    CASE WHEN has_created_at THEN '✓' ELSE '✗' END as has_created_at,
    CASE WHEN has_updated_at THEN '✓' ELSE '✗' END as has_updated_at,
    CASE
        WHEN has_created_at AND has_updated_at THEN 'Complete'
        WHEN has_created_at OR has_updated_at THEN 'Partial'
        ELSE 'Missing timestamps'
    END as status
FROM (
    SELECT DISTINCT
        c.table_name,
        MAX(CASE WHEN c.column_name IN ('created_at', 'createdat') THEN 1 ELSE 0 END) = 1 as has_created_at,
        MAX(CASE WHEN c.column_name IN ('updated_at', 'updatedat') THEN 1 ELSE 0 END) = 1 as has_updated_at
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    GROUP BY c.table_name
) t
ORDER BY status, table_name;

-- ============================================================================
-- PART 10: JUNCTION/MAPPING TABLES
-- ============================================================================
-- Tables that look like many-to-many relationships

SELECT
    'JUNCTION TABLES' as section,
    table_name,
    column_count,
    fk_count,
    CASE
        WHEN column_count = 2 AND fk_count = 2 THEN 'Pure junction table'
        WHEN fk_count >= 2 THEN 'Junction table with metadata'
        ELSE 'Regular table'
    END as table_type
FROM (
    SELECT
        t.tablename as table_name,
        (SELECT COUNT(*) FROM information_schema.columns c
         WHERE c.table_name = t.tablename AND c.table_schema = 'public') as column_count,
        (SELECT COUNT(*) FROM information_schema.table_constraints tc
         WHERE tc.table_name = t.tablename
         AND tc.table_schema = 'public'
         AND tc.constraint_type = 'FOREIGN KEY') as fk_count
    FROM pg_tables t
    WHERE t.schemaname = 'public'
) stats
WHERE fk_count >= 2
ORDER BY table_type, table_name;

-- ============================================================================
-- PART 11: TABLES WITH RLS (ROW LEVEL SECURITY) ENABLED
-- ============================================================================

SELECT
    'RLS STATUS' as section,
    tablename as table_name,
    CASE
        WHEN rowsecurity THEN 'ENABLED ✓'
        ELSE 'DISABLED ⚠️'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity DESC, tablename;

-- ============================================================================
-- PART 12: IDENTIFY POTENTIAL REDUNDANCY ISSUES
-- ============================================================================

DO $$
DECLARE
    v_table_record RECORD;
    v_issue_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'REDUNDANCY AND CLEANUP ANALYSIS';
    RAISE NOTICE '============================================================';

    -- Check for empty tables
    FOR v_table_record IN
        SELECT tablename,
               (SELECT COUNT(*) FROM pg_class WHERE relname = tablename AND reltuples = 0) as is_empty
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        DECLARE
            v_row_count BIGINT;
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', v_table_record.tablename) INTO v_row_count;

            IF v_row_count = 0 THEN
                v_issue_count := v_issue_count + 1;
                RAISE NOTICE '⚠️  Table "%" is EMPTY (consider removing if unused)', v_table_record.tablename;
            END IF;
        END;
    END LOOP;

    -- Check for tables with similar names (potential duplicates)
    FOR v_table_record IN
        WITH similar_names AS (
            SELECT
                t1.tablename as table1,
                t2.tablename as table2
            FROM pg_tables t1
            JOIN pg_tables t2 ON (
                t1.tablename != t2.tablename
                AND (
                    -- Check if one name is a prefix of the other with underscore
                    t1.tablename LIKE t2.tablename || '_%'
                    OR t2.tablename LIKE t1.tablename || '_%'
                    -- Check for _old, _new, _backup, _temp suffixes
                    OR (t1.tablename = t2.tablename || '_old')
                    OR (t1.tablename = t2.tablename || '_new')
                    OR (t1.tablename = t2.tablename || '_backup')
                    OR (t1.tablename = t2.tablename || '_temp')
                    OR (t2.tablename = t1.tablename || '_old')
                    OR (t2.tablename = t1.tablename || '_new')
                    OR (t2.tablename = t1.tablename || '_backup')
                    OR (t2.tablename = t1.tablename || '_temp')
                )
            )
            WHERE t1.schemaname = 'public'
                AND t2.schemaname = 'public'
                AND t1.tablename < t2.tablename
        )
        SELECT DISTINCT table1, table2
        FROM similar_names
    LOOP
        v_issue_count := v_issue_count + 1;
        RAISE NOTICE '⚠️  Similar table names: "%" and "%" (check if redundant)',
            v_table_record.table1, v_table_record.table2;
    END LOOP;

    IF v_issue_count = 0 THEN
        RAISE NOTICE '✓ No obvious redundancy issues detected';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'Found % potential issues to review', v_issue_count;
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 13: SUMMARY STATISTICS
-- ============================================================================

DO $$
DECLARE
    v_total_tables INTEGER;
    v_total_size TEXT;
    v_empty_tables INTEGER;
    v_tables_with_data INTEGER;
    v_tables_with_rls INTEGER;
    v_tables_with_triggers INTEGER;
BEGIN
    -- Count total tables
    SELECT COUNT(*) INTO v_total_tables
    FROM pg_tables
    WHERE schemaname = 'public';

    -- Calculate total database size
    SELECT pg_size_pretty(SUM(pg_total_relation_size(schemaname||'.'||tablename)))
    INTO v_total_size
    FROM pg_tables
    WHERE schemaname = 'public';

    -- Count empty tables
    SELECT COUNT(*) INTO v_empty_tables
    FROM pg_tables t
    WHERE schemaname = 'public'
        AND (SELECT COUNT(*) FROM pg_class WHERE relname = t.tablename AND reltuples = 0) > 0;

    -- Tables with data
    v_tables_with_data := v_total_tables - v_empty_tables;

    -- Tables with RLS
    SELECT COUNT(*) INTO v_tables_with_rls
    FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true;

    -- Tables with triggers
    SELECT COUNT(DISTINCT c.relname) INTO v_tables_with_triggers
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE NOT t.tgisinternal AND n.nspname = 'public';

    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'DATABASE SUMMARY';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Total tables: %', v_total_tables;
    RAISE NOTICE 'Total database size: %', v_total_size;
    RAISE NOTICE 'Tables with data: %', v_tables_with_data;
    RAISE NOTICE 'Empty tables: % ⚠️', v_empty_tables;
    RAISE NOTICE 'Tables with RLS enabled: %', v_tables_with_rls;
    RAISE NOTICE 'Tables with triggers: %', v_tables_with_triggers;
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 14: RECOMMENDED ACTIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'RECOMMENDED ACTIONS';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '1. Review EMPTY TABLES - consider dropping if truly unused';
    RAISE NOTICE '2. Review ORPHANED TABLES - ensure they are intentionally standalone';
    RAISE NOTICE '3. Review TABLES WITHOUT INDEXES - add indexes for performance';
    RAISE NOTICE '4. Review SIMILAR TABLE STRUCTURES - consolidate if redundant';
    RAISE NOTICE '5. Review POTENTIALLY UNUSED TABLES - verify with application code';
    RAISE NOTICE '6. Review tables with MISSING TIMESTAMPS - add for audit trails';
    RAISE NOTICE '7. Review RLS DISABLED tables - enable for security if needed';
    RAISE NOTICE '============================================================';
END $$;
