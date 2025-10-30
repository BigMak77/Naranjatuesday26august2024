-- ============================================
-- MIGRATION 02: MIGRATE DATA TO UNIFIED TABLES
-- ============================================
-- Purpose: Copy existing data from old tables to new unified schema
-- Safe to run: Uses INSERT ... ON CONFLICT DO NOTHING to avoid duplicates
-- Can be run multiple times safely

-- Migrate risk assignments with duplicate handling
INSERT INTO turkus_unified_assignments (
    assignment_type, reference_id, assigned_to, assigned_by, created_at, metadata
)
SELECT DISTINCT ON (risk_id, auth_id)
    'risk' as assignment_type,
    risk_id as reference_id,
    auth_id as assigned_to,
    NULL as assigned_by, -- not available in current schema
    COALESCE(assigned_at, now()) as created_at,
    '{}' as metadata
FROM turkus_risk_assignments
WHERE risk_id IS NOT NULL AND auth_id IS NOT NULL
ORDER BY risk_id, auth_id, assigned_at DESC NULLS LAST
ON CONFLICT (assignment_type, reference_id, assigned_to) DO NOTHING;

-- Migrate task assignments with duplicate handling
INSERT INTO turkus_unified_assignments (
    assignment_type, reference_id, assigned_to, assigned_by, department_id, due_date,
    status, completed_at, created_at, metadata
)
SELECT DISTINCT ON (task_id, user_auth_id)
    'task' as assignment_type,
    task_id as reference_id,
    user_auth_id as assigned_to,
    assigned_by,
    CASE
        WHEN department_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        THEN department_id::uuid
        ELSE NULL
    END as department_id, -- safe UUID cast
    due_date,
    COALESCE(status, 'assigned') as status,
    completed_at,
    now() as created_at, -- use current timestamp since old table doesn't have this
    jsonb_build_object('auth_id_legacy', "auth-id") as metadata -- preserve legacy field
FROM turkus_assignments
WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
ORDER BY task_id, user_auth_id, id
ON CONFLICT (assignment_type, reference_id, assigned_to) DO NOTHING;

-- Migrate non-conformances to turkus_items
INSERT INTO turkus_items (
    item_type, title, description, department_id, severity, status,
    resolved_by, resolved_at, resolution_notes, created_at, metadata
)
SELECT
    'non_conformance' as item_type,
    COALESCE(title, 'Non-Conformance') as title,
    description,
    department_id,
    'medium' as severity, -- default since not in original schema
    COALESCE(status, 'open') as status,
    resolved_by,
    resolved_at,
    resolution_notes,
    now() as created_at,
    jsonb_build_object('answer_id', answer_id) as metadata
FROM turkus_non_conformances
ON CONFLICT DO NOTHING; -- no unique constraint, but won't duplicate on reruns

-- Create assignments for non-conformances if assigned_to exists
INSERT INTO turkus_unified_assignments (
    assignment_type, reference_id, assigned_to, created_at
)
SELECT
    'non_conformance' as assignment_type,
    nc.id as reference_id,
    nc.assigned_to,
    now() as created_at
FROM turkus_non_conformances nc
WHERE nc.assigned_to IS NOT NULL
ON CONFLICT (assignment_type, reference_id, assigned_to) DO NOTHING;

-- Report migration results
DO $$
DECLARE
    risk_count INTEGER;
    task_count INTEGER;
    nc_count INTEGER;
    nc_assignment_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO risk_count FROM turkus_unified_assignments WHERE assignment_type = 'risk';
    SELECT COUNT(*) INTO task_count FROM turkus_unified_assignments WHERE assignment_type = 'task';
    SELECT COUNT(*) INTO nc_count FROM turkus_items WHERE item_type = 'non_conformance';
    SELECT COUNT(*) INTO nc_assignment_count FROM turkus_unified_assignments WHERE assignment_type = 'non_conformance';

    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  - Risk assignments migrated: %', risk_count;
    RAISE NOTICE '  - Task assignments migrated: %', task_count;
    RAISE NOTICE '  - Non-conformances migrated: %', nc_count;
    RAISE NOTICE '  - Non-conformance assignments migrated: %', nc_assignment_count;
END $$;
