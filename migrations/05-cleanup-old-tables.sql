-- ============================================
-- MIGRATION 05: CLEANUP OLD TABLES
-- ============================================
-- Purpose: Remove old tables after successful migration
-- WARNING: This is destructive! Only run after verifying data migration
-- Recommendation: Take a database backup before running this

-- SAFETY CHECK: Uncomment the line below to enable this migration
-- SET LOCAL turkus_migration_cleanup_enabled = 'true';

-- DO $$
-- BEGIN
--   -- Check if cleanup is explicitly enabled
--   IF current_setting('turkus_migration_cleanup_enabled', true) != 'true' THEN
--     RAISE EXCEPTION 'Cleanup not enabled. This migration drops old tables. Set turkus_migration_cleanup_enabled=true to proceed.';
--   END IF;
-- END $$;

-- Drop unused tables (never had data or code references)
DROP TABLE IF EXISTS turkus_submission_answers CASCADE;
DROP TABLE IF EXISTS turkus_submissions CASCADE;
DROP TABLE IF EXISTS turkus_schedules CASCADE;

-- Drop old assignment tables (data migrated to turkus_unified_assignments)
-- These are the risky ones - only drop after verification
DROP TABLE IF EXISTS turkus_risk_assignments CASCADE;
DROP TABLE IF EXISTS turkus_assignments CASCADE;

-- Drop old non-conformances table (data migrated to turkus_items)
DROP TABLE IF EXISTS turkus_non_conformances CASCADE;

-- Keep these tables as they contain the actual items being assigned:
-- - turkus_tasks (still needed for task definitions)
-- - turkus_risks (still needed for risk assessments)

-- Report cleanup completion
DO $$
BEGIN
    RAISE NOTICE 'Cleanup complete. Old assignment tables have been removed.';
    RAISE NOTICE 'Remaining tables: turkus_tasks, turkus_risks, turkus_unified_assignments, turkus_items';
END $$;
