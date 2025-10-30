-- ============================================
-- MIGRATION 03: CREATE COMPATIBILITY VIEWS
-- ============================================
-- Purpose: Create views that match old table structures for backward compatibility
-- This allows existing queries to work without modification during transition
-- Safe to run: Creates views only, doesn't modify data

-- Risk assignments view (backward compatible with turkus_risk_assignments)
CREATE OR REPLACE VIEW turkus_risk_assignments_view AS
SELECT
    id,
    reference_id as risk_id,
    assigned_to as auth_id,
    created_at as assigned_at
FROM turkus_unified_assignments
WHERE assignment_type = 'risk';

-- Task assignments view (backward compatible with turkus_assignments)
CREATE OR REPLACE VIEW turkus_assignments_view AS
SELECT
    id,
    reference_id as task_id,
    assigned_to as user_auth_id,
    assigned_by,
    department_id::text as department_id, -- cast back to text for compatibility
    due_date,
    status,
    completed_at,
    metadata->>'auth_id_legacy' as "auth-id",
    NULL::text as "auth-id" -- legacy field
FROM turkus_unified_assignments
WHERE assignment_type = 'task';

-- Non-conformances view (backward compatible with turkus_non_conformances)
CREATE OR REPLACE VIEW turkus_non_conformances_view AS
SELECT
    i.id,
    (i.metadata->>'answer_id')::uuid as answer_id,
    i.title,
    i.description,
    a.assigned_to,
    i.department_id,
    i.status,
    i.resolved_by,
    i.resolution_notes,
    i.resolved_at
FROM turkus_items i
LEFT JOIN LATERAL (
    SELECT assigned_to
    FROM turkus_unified_assignments
    WHERE assignment_type = 'non_conformance'
    AND reference_id = i.id
    LIMIT 1
) a ON true
WHERE i.item_type = 'non_conformance';

COMMENT ON VIEW turkus_risk_assignments_view IS 'Backward compatible view for turkus_risk_assignments queries';
COMMENT ON VIEW turkus_assignments_view IS 'Backward compatible view for turkus_assignments queries';
COMMENT ON VIEW turkus_non_conformances_view IS 'Backward compatible view for turkus_non_conformances queries';
