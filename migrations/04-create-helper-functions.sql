-- ============================================
-- MIGRATION 04: CREATE HELPER FUNCTIONS
-- ============================================
-- Purpose: Create reusable functions for common operations
-- These functions provide a clean API for working with unified assignments

-- Function to assign any turkus item
CREATE OR REPLACE FUNCTION assign_turkus_item(
    p_assignment_type TEXT,
    p_reference_id UUID,
    p_assigned_to UUID,
    p_assigned_by UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium',
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    INSERT INTO turkus_unified_assignments (
        assignment_type, reference_id, assigned_to, assigned_by,
        department_id, due_date, priority, metadata
    )
    VALUES (
        p_assignment_type, p_reference_id, p_assigned_to, p_assigned_by,
        p_department_id, p_due_date, p_priority, p_metadata
    )
    ON CONFLICT (assignment_type, reference_id, assigned_to)
    DO UPDATE SET
        assigned_by = EXCLUDED.assigned_by,
        department_id = EXCLUDED.department_id,
        due_date = EXCLUDED.due_date,
        priority = EXCLUDED.priority,
        metadata = EXCLUDED.metadata,
        updated_at = now()
    RETURNING id INTO assignment_id;

    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to complete an assignment
CREATE OR REPLACE FUNCTION complete_turkus_assignment(
    p_assignment_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE turkus_unified_assignments
    SET
        status = 'completed',
        completed_at = now(),
        notes = COALESCE(p_notes, notes),
        updated_at = now()
    WHERE id = p_assignment_id
      AND status != 'completed';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to start an assignment
CREATE OR REPLACE FUNCTION start_turkus_assignment(
    p_assignment_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE turkus_unified_assignments
    SET
        status = 'in_progress',
        started_at = COALESCE(started_at, now()),
        updated_at = now()
    WHERE id = p_assignment_id
      AND status = 'assigned';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get user assignments with details
CREATE OR REPLACE FUNCTION get_user_turkus_assignments(
    p_user_auth_id UUID,
    p_assignment_type TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    assignment_type TEXT,
    reference_id UUID,
    title TEXT,
    description TEXT,
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    department_name TEXT,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.id,
        ua.assignment_type,
        ua.reference_id,
        CASE
            WHEN ua.assignment_type = 'risk' THEN r.title
            WHEN ua.assignment_type = 'task' THEN t.title
            WHEN ua.assignment_type IN ('issue', 'non_conformance', 'audit') THEN i.title
            ELSE 'Unknown'
        END as title,
        CASE
            WHEN ua.assignment_type = 'risk' THEN r.description
            WHEN ua.assignment_type = 'task' THEN t.description
            WHEN ua.assignment_type IN ('issue', 'non_conformance', 'audit') THEN i.description
            ELSE NULL
        END as description,
        ua.status,
        ua.priority,
        ua.due_date,
        ua.created_at,
        d.name as department_name,
        ua.metadata
    FROM turkus_unified_assignments ua
    LEFT JOIN turkus_risks r ON ua.assignment_type = 'risk' AND ua.reference_id = r.id
    LEFT JOIN turkus_tasks t ON ua.assignment_type = 'task' AND ua.reference_id = t.id
    LEFT JOIN turkus_items i ON ua.assignment_type IN ('issue', 'non_conformance', 'audit') AND ua.reference_id = i.id
    LEFT JOIN departments d ON ua.department_id = d.id
    WHERE ua.assigned_to = p_user_auth_id
      AND (p_assignment_type IS NULL OR ua.assignment_type = p_assignment_type)
      AND (p_status IS NULL OR ua.status = p_status)
    ORDER BY
        CASE ua.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        ua.due_date ASC NULLS LAST,
        ua.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get overdue assignments
CREATE OR REPLACE FUNCTION get_overdue_turkus_assignments()
RETURNS TABLE (
    id UUID,
    assignment_type TEXT,
    reference_id UUID,
    title TEXT,
    assigned_to UUID,
    assigned_to_name TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.id,
        ua.assignment_type,
        ua.reference_id,
        CASE
            WHEN ua.assignment_type = 'risk' THEN r.title
            WHEN ua.assignment_type = 'task' THEN t.title
            WHEN ua.assignment_type IN ('issue', 'non_conformance', 'audit') THEN i.title
            ELSE 'Unknown'
        END as title,
        ua.assigned_to,
        u.first_name || ' ' || u.last_name as assigned_to_name,
        ua.due_date,
        EXTRACT(DAY FROM now() - ua.due_date)::INTEGER as days_overdue
    FROM turkus_unified_assignments ua
    LEFT JOIN turkus_risks r ON ua.assignment_type = 'risk' AND ua.reference_id = r.id
    LEFT JOIN turkus_tasks t ON ua.assignment_type = 'task' AND ua.reference_id = t.id
    LEFT JOIN turkus_items i ON ua.assignment_type IN ('issue', 'non_conformance', 'audit') AND ua.reference_id = i.id
    LEFT JOIN users u ON ua.assigned_to = u.auth_id
    WHERE ua.status IN ('assigned', 'in_progress')
      AND ua.due_date < now()
    ORDER BY ua.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to create an issue/non-conformance/audit and optionally assign it
CREATE OR REPLACE FUNCTION create_turkus_item(
    p_item_type TEXT,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_severity TEXT DEFAULT 'medium',
    p_created_by UUID DEFAULT NULL,
    p_assign_to UUID DEFAULT NULL,
    p_due_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    item_id UUID;
BEGIN
    -- Create the item
    INSERT INTO turkus_items (
        item_type, title, description, department_id, severity, created_by, metadata
    )
    VALUES (
        p_item_type, p_title, p_description, p_department_id, p_severity, p_created_by, p_metadata
    )
    RETURNING id INTO item_id;

    -- Assign if requested
    IF p_assign_to IS NOT NULL THEN
        PERFORM assign_turkus_item(
            p_item_type,
            item_id,
            p_assign_to,
            p_created_by,
            p_department_id,
            p_due_date
        );
    END IF;

    RETURN item_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION assign_turkus_item IS 'Assign any turkus item (risk, task, issue, etc.) to a user';
COMMENT ON FUNCTION complete_turkus_assignment IS 'Mark an assignment as completed';
COMMENT ON FUNCTION start_turkus_assignment IS 'Mark an assignment as in progress';
COMMENT ON FUNCTION get_user_turkus_assignments IS 'Get all assignments for a user with full details';
COMMENT ON FUNCTION get_overdue_turkus_assignments IS 'Get all overdue assignments across all types';
COMMENT ON FUNCTION create_turkus_item IS 'Create a new issue, non-conformance, or audit item and optionally assign it';
