-- ============================================================================
-- CURRENT SUPABASE DATABASE STATE - COMPLETE INVENTORY
-- ============================================================================
-- Run this in your Supabase SQL Editor to see EXACTLY what exists right now
-- in your database, not what the migrations say should exist.
-- ============================================================================

-- ============================================================================
-- PART 1: ALL TRIGGERS - COMPLETE LIST
-- ============================================================================
-- Shows every trigger in your database, what table it's on, when it fires

SELECT
    'TRIGGERS' as section,
    c.relname as table_name,
    t.tgname as trigger_name,
    p.proname as function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
        WHEN t.tgtype::integer & 32 = 32 THEN 'TRUNCATE'
    END as event,
    CASE
        WHEN t.tgtype::integer & 1 = 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- PART 2: ALL TRIGGER FUNCTIONS WITH FULL SOURCE CODE
-- ============================================================================
-- Shows every trigger function and its complete PL/pgSQL code

SELECT
    'TRIGGER FUNCTIONS' as section,
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS complete_source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 'trigger'::regtype
    AND n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- PART 3: TRIGGERS ON USERS TABLE (MOST CRITICAL)
-- ============================================================================
-- Detailed breakdown of all triggers on the users table

SELECT
    'USERS TABLE TRIGGERS' as section,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    pg_get_triggerdef(t.oid) AS full_trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname = 'users'
ORDER BY t.tgname;

-- ============================================================================
-- PART 4: TRIGGERS ON USER_ASSIGNMENTS TABLE
-- ============================================================================

SELECT
    'USER_ASSIGNMENTS TABLE TRIGGERS' as section,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    pg_get_triggerdef(t.oid) AS full_trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname = 'user_assignments'
ORDER BY t.tgname;

-- ============================================================================
-- PART 5: TRIGGERS ON TEST_ATTEMPTS TABLE
-- ============================================================================
-- Check if auto_complete_training_on_test_pass trigger exists

SELECT
    'TEST_ATTEMPTS TABLE TRIGGERS' as section,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    pg_get_triggerdef(t.oid) AS full_trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND c.relname = 'test_attempts'
ORDER BY t.tgname;

-- ============================================================================
-- PART 6: TRIGGER CONFLICTS - MULTIPLE TRIGGERS ON SAME TABLE/EVENT
-- ============================================================================
-- Shows where multiple triggers fire on the same event (potential conflicts)

SELECT
    'POTENTIAL CONFLICTS' as section,
    c.relname AS table_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    COUNT(*) as num_triggers,
    STRING_AGG(t.tgname, ', ' ORDER BY t.tgname) as trigger_names,
    STRING_AGG(p.proname, ', ' ORDER BY t.tgname) as function_names
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
GROUP BY c.relname, timing, event
HAVING COUNT(*) > 1
ORDER BY c.relname, timing, event;

-- ============================================================================
-- PART 7: ALL NON-TRIGGER FUNCTIONS (FOR REFERENCE)
-- ============================================================================
-- Shows regular functions (not triggers) that might be called by your app

SELECT
    'REGULAR FUNCTIONS' as section,
    p.proname AS function_name,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prorettype != 'trigger'::regtype
    AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================================================
-- PART 8: SUMMARY COUNTS
-- ============================================================================

SELECT 'SUMMARY' as section, 'Total Triggers' as metric, COUNT(*)::text as count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public'

UNION ALL

SELECT 'SUMMARY', 'Total Trigger Functions', COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 'trigger'::regtype AND n.nspname = 'public'

UNION ALL

SELECT 'SUMMARY', 'Triggers on users', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND c.relname = 'users'

UNION ALL

SELECT 'SUMMARY', 'Triggers on user_assignments', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND c.relname = 'user_assignments'

UNION ALL

SELECT 'SUMMARY', 'Triggers on test_attempts', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND c.relname = 'test_attempts'

UNION ALL

SELECT 'SUMMARY', 'Triggers on department_assignments', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND c.relname = 'department_assignments'

UNION ALL

SELECT 'SUMMARY', 'Triggers on role_assignments', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND c.relname = 'role_assignments'

UNION ALL

SELECT 'SUMMARY', 'Disabled Triggers', COUNT(*)::text
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal AND n.nspname = 'public' AND t.tgenabled != 'O';

-- ============================================================================
-- PART 9: SPECIFIC FUNCTION SOURCE CODE CHECKS
-- ============================================================================
-- Check the actual source code of critical functions to verify what they do

-- Check if auto_complete_training_on_test_pass exists and what it does
SELECT
    'FUNCTION CHECK: auto_complete_training_on_test_pass' as section,
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status,
    MAX(pg_get_functiondef(p.oid)) as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'auto_complete_training_on_test_pass'
    AND n.nspname = 'public';

-- Check department training function
SELECT
    'FUNCTION CHECK: sync_department_training_to_user' as section,
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status,
    MAX(pg_get_functiondef(p.oid)) as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'sync_department_training_to_user'
    AND n.nspname = 'public';

-- Check role training function
SELECT
    'FUNCTION CHECK: sync_role_training_to_user' as section,
    CASE
        WHEN COUNT(*) > 0 THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status,
    MAX(pg_get_functiondef(p.oid)) as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'sync_role_training_to_user'
    AND n.nspname = 'public';

-- ============================================================================
-- PART 10: TRIGGER EXECUTION ORDER BY TABLE
-- ============================================================================
-- Shows the exact order triggers will fire (alphabetically by trigger name)

SELECT
    'EXECUTION ORDER' as section,
    c.relname AS table_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    ROW_NUMBER() OVER (
        PARTITION BY c.relname,
        CASE WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END,
        CASE WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
             WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
             WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE' END
        ORDER BY t.tgname
    ) as execution_sequence,
    t.tgname AS trigger_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
ORDER BY c.relname, timing, event, execution_sequence;
