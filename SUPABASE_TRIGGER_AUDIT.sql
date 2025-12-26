-- ============================================================================
-- COMPREHENSIVE SUPABASE TRIGGER AUDIT
-- ============================================================================
-- Run these queries in your Supabase SQL Editor to understand all triggers,
-- functions, and their relationships in your database.
-- ============================================================================

-- ============================================================================
-- SECTION 1: ALL TRIGGERS IN THE DATABASE
-- ============================================================================
-- Lists all triggers, what tables they're on, when they fire, and what they do

SELECT
    n.nspname as schemaname,
    c.relname as tablename,
    t.tgname as triggername,
    t.tgenabled as enabled,
    CASE
        WHEN t.tgtype::integer & 1 = 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
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
    END as event
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- SECTION 2: DETAILED TRIGGER INFORMATION WITH FUNCTION NAMES
-- ============================================================================
-- Shows which function each trigger executes

SELECT
    t.tgname AS trigger_name,
    c.relname AS table_name,
    p.proname AS function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        WHEN t.tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    ARRAY(
        SELECT CASE
            WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
            WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
            WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
        END
    ) AS events,
    t.tgenabled::text AS enabled,
    pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- SECTION 3: ALL TRIGGERS ON THE USERS TABLE
-- ============================================================================
-- Critical table with potential conflicts

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================================================
-- SECTION 4: ALL TRIGGERS ON USER_ASSIGNMENTS TABLE
-- ============================================================================
-- Another critical table

SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'user_assignments'
    AND trigger_schema = 'public'
ORDER BY trigger_name;

-- ============================================================================
-- SECTION 5: ALL TRIGGER FUNCTIONS AND THEIR SOURCE CODE
-- ============================================================================
-- Shows the actual PL/pgSQL code for each trigger function

SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition,
    obj_description(p.oid) AS description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 'trigger'::regtype
    AND n.nspname = 'public'
ORDER BY p.proname;

-- ============================================================================
-- SECTION 6: TRIGGER EXECUTION ORDER ON EACH TABLE
-- ============================================================================
-- Shows the order triggers will fire (important for conflicts)

SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
    END as event,
    p.proname AS function_name,
    t.tgname AS execution_order  -- Triggers fire alphabetically by name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
ORDER BY c.relname, timing, event, t.tgname;

-- ============================================================================
-- SECTION 7: FIND POTENTIAL TRIGGER CONFLICTS
-- ============================================================================
-- Multiple triggers on same table/event that might conflict

SELECT
    event_object_table AS table_name,
    action_timing,
    event_manipulation,
    COUNT(*) as trigger_count,
    STRING_AGG(trigger_name, ', ' ORDER BY trigger_name) as triggers
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table, action_timing, event_manipulation
HAVING COUNT(*) > 1
ORDER BY event_object_table, action_timing, event_manipulation;

-- ============================================================================
-- SECTION 8: TRIGGERS THAT MODIFY user_assignments TABLE
-- ============================================================================
-- Find all triggers whose functions INSERT/UPDATE/DELETE user_assignments

SELECT
    p.proname AS function_name,
    c.relname AS attached_to_table,
    t.tgname AS trigger_name,
    CASE
        WHEN pg_get_functiondef(p.oid) LIKE '%INSERT INTO user_assignments%' THEN 'INSERTS'
        WHEN pg_get_functiondef(p.oid) LIKE '%UPDATE user_assignments%' THEN 'UPDATES'
        WHEN pg_get_functiondef(p.oid) LIKE '%DELETE FROM user_assignments%' THEN 'DELETES'
    END as modifies_user_assignments
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 'trigger'::regtype
    AND n.nspname = 'public'
    AND (
        pg_get_functiondef(p.oid) LIKE '%user_assignments%'
    )
ORDER BY c.relname, p.proname;

-- ============================================================================
-- SECTION 9: CHECK FOR DISABLED TRIGGERS
-- ============================================================================
-- Shows if any triggers are disabled (might cause issues)

SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND t.tgenabled != 'O'
ORDER BY c.relname, t.tgname;

-- ============================================================================
-- SECTION 10: TRIGGER DEPENDENCY MAP
-- ============================================================================
-- Shows which triggers might affect each other

WITH trigger_info AS (
    SELECT
        c.relname AS table_name,
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
        END as event
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE NOT t.tgisinternal
        AND n.nspname = 'public'
)
SELECT
    table_name,
    timing,
    event,
    COUNT(*) as num_triggers,
    STRING_AGG(trigger_name || ' → ' || function_name, ' | ' ORDER BY trigger_name) as trigger_chain
FROM trigger_info
GROUP BY table_name, timing, event
ORDER BY table_name, timing, event;

-- ============================================================================
-- SECTION 11: TRAINING-RELATED TRIGGERS SUMMARY
-- ============================================================================
-- Focus on training assignment logic

SELECT
    c.relname AS table_name,
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE
        WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    obj_description(p.oid) AS purpose
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'
    AND (
        p.proname LIKE '%training%' OR
        p.proname LIKE '%department%' OR
        p.proname LIKE '%role%' OR
        p.proname LIKE '%assignment%' OR
        p.proname LIKE '%module%' OR
        p.proname LIKE '%group%'
    )
ORDER BY c.relname, timing, t.tgname;

-- ============================================================================
-- SECTION 12: CHECK TRIGGER CONDITIONS (WHEN CLAUSES)
-- ============================================================================
-- Shows conditional triggers that only fire under certain conditions

SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND action_condition IS NOT NULL
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- SUMMARY: QUICK REFERENCE
-- ============================================================================

SELECT
    'Total Triggers' as metric,
    COUNT(*)::text as value
FROM pg_trigger t
JOIN pg_namespace n ON t.tgrelid IN (
    SELECT oid FROM pg_class WHERE relnamespace = n.oid
)
WHERE NOT t.tgisinternal
    AND n.nspname = 'public'

UNION ALL

SELECT
    'Total Trigger Functions',
    COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.prorettype = 'trigger'::regtype
    AND n.nspname = 'public'

UNION ALL

SELECT
    'Triggers on users table',
    COUNT(*)::text
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND trigger_schema = 'public'

UNION ALL

SELECT
    'Triggers on user_assignments table',
    COUNT(*)::text
FROM information_schema.triggers
WHERE event_object_table = 'user_assignments'
    AND trigger_schema = 'public';
