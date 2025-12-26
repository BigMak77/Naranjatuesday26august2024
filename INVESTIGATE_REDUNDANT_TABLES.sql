-- ============================================================================
-- INVESTIGATE REDUNDANT TABLES - DETAILED ANALYSIS
-- ============================================================================
-- This script compares suspected duplicate/redundant tables to determine:
-- 1. If they have identical or similar structures
-- 2. If they contain the same or overlapping data
-- 3. Which one should be kept and which should be dropped
-- 4. Migration path if data needs to be consolidated
-- ============================================================================

-- ============================================================================
-- PART 1: INCIDENT_PEOPLE vs INCIDENT_PERSONS
-- ============================================================================
-- These have VERY similar names - likely one is a typo/duplicate

DO $$
DECLARE
    v_people_exists BOOLEAN;
    v_persons_exists BOOLEAN;
    v_people_count BIGINT := 0;
    v_persons_count BIGINT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: incident_people vs incident_persons';
    RAISE NOTICE '============================================================';

    -- Check if tables exist
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'incident_people') INTO v_people_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'incident_persons') INTO v_persons_exists;

    IF v_people_exists AND v_persons_exists THEN
        -- Get row counts
        EXECUTE 'SELECT COUNT(*) FROM incident_people' INTO v_people_count;
        EXECUTE 'SELECT COUNT(*) FROM incident_persons' INTO v_persons_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  incident_people:  % rows', v_people_count;
        RAISE NOTICE '  incident_persons: % rows', v_persons_count;
        RAISE NOTICE '';

        IF v_people_count = 0 AND v_persons_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Both are empty - DROP both or keep one for future use';
        ELSIF v_people_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP incident_people (empty, keep incident_persons)';
        ELSIF v_persons_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP incident_persons (empty, keep incident_people)';
        ELSE
            RAISE NOTICE 'Both have data - need to check for overlap';
        END IF;
    ELSIF v_people_exists THEN
        RAISE NOTICE 'Only incident_people exists';
    ELSIF v_persons_exists THEN
        RAISE NOTICE 'Only incident_persons exists';
    ELSE
        RAISE NOTICE 'Neither table exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- Compare structures of incident_people vs incident_persons
WITH p AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'incident_people' AND table_schema = 'public'
),
ps AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'incident_persons' AND table_schema = 'public'
)
SELECT
    'INCIDENT_PEOPLE vs INCIDENT_PERSONS STRUCTURE' as section,
    COALESCE(p.column_name, ps.column_name) as column_name,
    CASE
        WHEN p.column_name IS NULL THEN 'Only in incident_persons'
        WHEN ps.column_name IS NULL THEN 'Only in incident_people'
        WHEN p.data_type = ps.data_type THEN 'Same type: ' || p.data_type
        ELSE 'DIFFERENT: ' || p.data_type || ' vs ' || ps.data_type
    END as comparison
FROM p
FULL OUTER JOIN ps ON p.column_name = ps.column_name
ORDER BY column_name;

-- ============================================================================
-- PART 2: TRAINING vs TRAINING_LOGS
-- ============================================================================

DO $$
DECLARE
    v_training_exists BOOLEAN;
    v_logs_exists BOOLEAN;
    v_training_count BIGINT := 0;
    v_logs_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: training vs training_logs';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'training') INTO v_training_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'training_logs') INTO v_logs_exists;

    IF v_training_exists AND v_logs_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM training' INTO v_training_count;
        EXECUTE 'SELECT COUNT(*) FROM training_logs' INTO v_logs_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  training:      % rows', v_training_count;
        RAISE NOTICE '  training_logs: % rows', v_logs_count;
        RAISE NOTICE '';

        IF v_training_count = 0 AND v_logs_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP training (empty, use training_logs)';
        ELSIF v_logs_count = 0 AND v_training_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Migrate data from training to training_logs, then drop training';
        ELSIF v_training_count > 0 AND v_logs_count > 0 THEN
            RAISE NOTICE 'Both have data - check if they serve different purposes';
        ELSE
            RAISE NOTICE 'Both empty - DROP one';
        END IF;
    ELSIF v_training_exists THEN
        RAISE NOTICE 'Only training exists';
    ELSIF v_logs_exists THEN
        RAISE NOTICE 'Only training_logs exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- Compare structures
WITH t AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'training' AND table_schema = 'public'
),
tl AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'training_logs' AND table_schema = 'public'
)
SELECT
    'TRAINING vs TRAINING_LOGS STRUCTURE' as section,
    COALESCE(t.column_name, tl.column_name) as column_name,
    CASE
        WHEN t.column_name IS NULL THEN 'Only in training_logs'
        WHEN tl.column_name IS NULL THEN 'Only in training'
        WHEN t.data_type = tl.data_type THEN 'Same type: ' || t.data_type
        ELSE 'DIFFERENT: ' || t.data_type || ' vs ' || tl.data_type
    END as comparison
FROM t
FULL OUTER JOIN tl ON t.column_name = tl.column_name
ORDER BY column_name;

-- ============================================================================
-- PART 3: MODULE_ASSIGNMENTS vs USER_ASSIGNMENTS (where item_type='module')
-- ============================================================================

DO $$
DECLARE
    v_module_assignments_exists BOOLEAN;
    v_user_assignments_exists BOOLEAN;
    v_module_count BIGINT := 0;
    v_user_module_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: module_assignments vs user_assignments';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'module_assignments') INTO v_module_assignments_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_assignments') INTO v_user_assignments_exists;

    IF v_module_assignments_exists AND v_user_assignments_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM module_assignments' INTO v_module_count;
        EXECUTE 'SELECT COUNT(*) FROM user_assignments WHERE item_type = ''module''' INTO v_user_module_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  module_assignments:                    % rows', v_module_count;
        RAISE NOTICE '  user_assignments (item_type=module):   % rows', v_user_module_count;
        RAISE NOTICE '';

        IF v_module_count = 0 AND v_user_module_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP module_assignments (empty, use user_assignments)';
        ELSIF v_module_count > 0 AND v_user_module_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Migrate module_assignments to user_assignments';
        ELSIF v_module_count > 0 AND v_user_module_count > 0 THEN
            RAISE NOTICE 'Both have data - check for duplicates or different purposes';
        ELSE
            RAISE NOTICE 'Both empty';
        END IF;
    ELSIF v_module_assignments_exists THEN
        RAISE NOTICE 'Only module_assignments exists';
    ELSIF v_user_assignments_exists THEN
        RAISE NOTICE 'Only user_assignments exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- Compare structures
WITH ma AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'module_assignments' AND table_schema = 'public'
),
ua AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_assignments' AND table_schema = 'public'
)
SELECT
    'MODULE_ASSIGNMENTS vs USER_ASSIGNMENTS STRUCTURE' as section,
    COALESCE(ma.column_name, ua.column_name) as column_name,
    CASE
        WHEN ma.column_name IS NULL THEN 'Only in user_assignments'
        WHEN ua.column_name IS NULL THEN 'Only in module_assignments'
        WHEN ma.data_type = ua.data_type THEN 'Same type: ' || ma.data_type
        ELSE 'DIFFERENT: ' || ma.data_type || ' vs ' || ua.data_type
    END as comparison
FROM ma
FULL OUTER JOIN ua ON ma.column_name = ua.column_name
ORDER BY column_name;

-- ============================================================================
-- PART 4: USER_ROLE_CHANGE_LOG vs USER_ROLE_HISTORY
-- ============================================================================

DO $$
DECLARE
    v_change_log_exists BOOLEAN;
    v_history_exists BOOLEAN;
    v_change_log_count BIGINT := 0;
    v_history_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: user_role_change_log vs user_role_history';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_role_change_log') INTO v_change_log_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_role_history') INTO v_history_exists;

    IF v_change_log_exists AND v_history_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM user_role_change_log' INTO v_change_log_count;
        EXECUTE 'SELECT COUNT(*) FROM user_role_history' INTO v_history_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  user_role_change_log: % rows (RLS: DISABLED)', v_change_log_count;
        RAISE NOTICE '  user_role_history:    % rows (RLS: ENABLED)', v_history_count;
        RAISE NOTICE '';

        IF v_change_log_count = 0 AND v_history_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP user_role_change_log (empty, use user_role_history)';
        ELSIF v_change_log_count > 0 AND v_history_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Migrate to user_role_history (has RLS), then drop user_role_change_log';
        ELSIF v_change_log_count > 0 AND v_history_count > 0 THEN
            RAISE NOTICE 'Both have data - consolidate into user_role_history (has RLS)';
        ELSE
            RAISE NOTICE 'Both empty - DROP user_role_change_log, keep user_role_history (has RLS)';
        END IF;
    ELSIF v_change_log_exists THEN
        RAISE NOTICE 'Only user_role_change_log exists';
    ELSIF v_history_exists THEN
        RAISE NOTICE 'Only user_role_history exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- Compare structures
WITH cl AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_role_change_log' AND table_schema = 'public'
),
h AS (
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'user_role_history' AND table_schema = 'public'
)
SELECT
    'USER_ROLE_CHANGE_LOG vs USER_ROLE_HISTORY STRUCTURE' as section,
    COALESCE(cl.column_name, h.column_name) as column_name,
    CASE
        WHEN cl.column_name IS NULL THEN 'Only in user_role_history'
        WHEN h.column_name IS NULL THEN 'Only in user_role_change_log'
        WHEN cl.data_type = h.data_type THEN 'Same type: ' || cl.data_type
        ELSE 'DIFFERENT: ' || cl.data_type || ' vs ' || h.data_type
    END as comparison
FROM cl
FULL OUTER JOIN h ON cl.column_name = h.column_name
ORDER BY column_name;

-- ============================================================================
-- PART 5: DEPARTMENT_MODULES vs DEPARTMENT_ASSIGNMENTS
-- ============================================================================

DO $$
DECLARE
    v_dept_modules_exists BOOLEAN;
    v_dept_assignments_exists BOOLEAN;
    v_dept_modules_count BIGINT := 0;
    v_dept_module_assignments_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: department_modules vs department_assignments';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'department_modules') INTO v_dept_modules_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'department_assignments') INTO v_dept_assignments_exists;

    IF v_dept_modules_exists AND v_dept_assignments_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM department_modules' INTO v_dept_modules_count;
        EXECUTE 'SELECT COUNT(*) FROM department_assignments WHERE type = ''module''' INTO v_dept_module_assignments_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  department_modules:                      % rows', v_dept_modules_count;
        RAISE NOTICE '  department_assignments (type=module):    % rows', v_dept_module_assignments_count;
        RAISE NOTICE '';

        IF v_dept_modules_count = 0 AND v_dept_module_assignments_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP department_modules (empty, use department_assignments)';
        ELSIF v_dept_modules_count > 0 AND v_dept_module_assignments_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Migrate department_modules to department_assignments';
        ELSIF v_dept_modules_count > 0 AND v_dept_module_assignments_count > 0 THEN
            RAISE NOTICE 'Both have data - consolidate into department_assignments (more generic)';
        ELSE
            RAISE NOTICE 'Both empty - DROP department_modules';
        END IF;
    ELSIF v_dept_modules_exists THEN
        RAISE NOTICE 'Only department_modules exists';
    ELSIF v_dept_assignments_exists THEN
        RAISE NOTICE 'Only department_assignments exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 6: TURKUS SYSTEM TABLES (Legacy?)
-- ============================================================================

DO $$
DECLARE
    v_table_record RECORD;
    v_total_rows BIGINT := 0;
    v_table_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: TURKUS SYSTEM TABLES';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Checking all tables with "turkus" prefix:';
    RAISE NOTICE '';

    FOR v_table_record IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename LIKE 'turkus_%'
        ORDER BY tablename
    LOOP
        DECLARE
            v_row_count BIGINT;
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I', v_table_record.tablename) INTO v_row_count;
            v_table_count := v_table_count + 1;
            v_total_rows := v_total_rows + v_row_count;

            RAISE NOTICE '  % - % rows', RPAD(v_table_record.tablename, 40), v_row_count;
        END;
    END LOOP;

    IF v_table_count = 0 THEN
        RAISE NOTICE '  No turkus tables found';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE 'Total turkus tables: %', v_table_count;
        RAISE NOTICE 'Total rows across all turkus tables: %', v_total_rows;
        RAISE NOTICE '';

        IF v_total_rows = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: All turkus tables are EMPTY - safe to DROP';
        ELSE
            RAISE NOTICE 'RECOMMENDATION: Turkus tables contain data - verify if system is still in use';
        END IF;
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 7: USERS_ROLES vs USER_ROLE_PROFILES
-- ============================================================================

DO $$
DECLARE
    v_users_roles_exists BOOLEAN;
    v_profiles_exists BOOLEAN;
    v_users_roles_count BIGINT := 0;
    v_profiles_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: users_roles vs user_role_profiles';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users_roles') INTO v_users_roles_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_role_profiles') INTO v_profiles_exists;

    IF v_users_roles_exists AND v_profiles_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM users_roles' INTO v_users_roles_count;
        EXECUTE 'SELECT COUNT(*) FROM user_role_profiles' INTO v_profiles_count;

        RAISE NOTICE 'Both tables exist:';
        RAISE NOTICE '  users_roles:         % rows', v_users_roles_count;
        RAISE NOTICE '  user_role_profiles:  % rows', v_profiles_count;
        RAISE NOTICE '';

        IF v_users_roles_count = 0 AND v_profiles_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP users_roles (empty)';
        ELSIF v_users_roles_count > 0 AND v_profiles_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP user_role_profiles (empty)';
        ELSIF v_users_roles_count > 0 AND v_profiles_count > 0 THEN
            RAISE NOTICE 'Both have data - check if they serve different purposes';
        ELSE
            RAISE NOTICE 'Both empty - DROP one';
        END IF;
    ELSIF v_users_roles_exists THEN
        RAISE NOTICE 'Only users_roles exists';
    ELSIF v_profiles_exists THEN
        RAISE NOTICE 'Only user_role_profiles exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 8: MODULE_COMPLETIONS vs USER_ASSIGNMENTS.COMPLETED_AT
-- ============================================================================

DO $$
DECLARE
    v_module_completions_exists BOOLEAN;
    v_user_assignments_exists BOOLEAN;
    v_completions_count BIGINT := 0;
    v_completed_assignments_count BIGINT := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'INVESTIGATING: module_completions vs user_assignments.completed_at';
    RAISE NOTICE '============================================================';

    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'module_completions') INTO v_module_completions_exists;
    SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_assignments') INTO v_user_assignments_exists;

    IF v_module_completions_exists AND v_user_assignments_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM module_completions' INTO v_completions_count;
        EXECUTE 'SELECT COUNT(*) FROM user_assignments WHERE completed_at IS NOT NULL AND item_type = ''module''' INTO v_completed_assignments_count;

        RAISE NOTICE 'Both exist:';
        RAISE NOTICE '  module_completions:                                  % rows', v_completions_count;
        RAISE NOTICE '  user_assignments (completed modules):                % rows', v_completed_assignments_count;
        RAISE NOTICE '';

        IF v_completions_count = 0 AND v_completed_assignments_count > 0 THEN
            RAISE NOTICE 'RECOMMENDATION: DROP module_completions (empty, use user_assignments)';
        ELSIF v_completions_count > 0 AND v_completed_assignments_count = 0 THEN
            RAISE NOTICE 'RECOMMENDATION: Migrate module_completions to user_assignments';
        ELSIF v_completions_count > 0 AND v_completed_assignments_count > 0 THEN
            RAISE NOTICE 'Both track completions - consolidate to avoid data inconsistency';
        ELSE
            RAISE NOTICE 'Both empty';
        END IF;
    ELSIF v_module_completions_exists THEN
        RAISE NOTICE 'Only module_completions exists';
    ELSIF v_user_assignments_exists THEN
        RAISE NOTICE 'Only user_assignments exists';
    END IF;

    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- PART 9: SUMMARY OF ALL REDUNDANT TABLE INVESTIGATIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'REDUNDANCY INVESTIGATION SUMMARY';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Review the output above for each table pair.';
    RAISE NOTICE 'Key questions answered:';
    RAISE NOTICE '  1. Do both tables exist?';
    RAISE NOTICE '  2. How many rows does each have?';
    RAISE NOTICE '  3. Do they have the same structure?';
    RAISE NOTICE '  4. Which should be kept/dropped?';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. For empty duplicates: DROP immediately';
    RAISE NOTICE '  2. For tables with data: Create migration script';
    RAISE NOTICE '  3. For unclear cases: Check application code usage';
    RAISE NOTICE '  4. Always backup before dropping!';
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
END $$;
