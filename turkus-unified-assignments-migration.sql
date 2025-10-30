-- Unified Turkus Assignments Table Migration
-- This creates a single table to handle all assignment types: risks, tasks, audits, non-conformances, issues

-- 1. Create the unified assignments table
CREATE TABLE turkus_unified_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Assignment type and reference
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('risk', 'task', 'audit', 'non_conformance', 'issue')),
    reference_id UUID NOT NULL, -- ID of the assigned item (risk_id, task_id, etc.)
    
    -- Assignment details
    assigned_to UUID NOT NULL, -- user auth_id
    assigned_by UUID, -- who made the assignment
    department_id UUID,
    
    -- Scheduling and status
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Completion tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional data (flexible JSON for type-specific fields)
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Indexes for performance
    CONSTRAINT unique_assignment_per_user UNIQUE (assignment_type, reference_id, assigned_to)
);

-- Create indexes for better performance
CREATE INDEX idx_turkus_unified_assignments_type ON turkus_unified_assignments(assignment_type);
CREATE INDEX idx_turkus_unified_assignments_assigned_to ON turkus_unified_assignments(assigned_to);
CREATE INDEX idx_turkus_unified_assignments_reference ON turkus_unified_assignments(assignment_type, reference_id);
CREATE INDEX idx_turkus_unified_assignments_status ON turkus_unified_assignments(status);
CREATE INDEX idx_turkus_unified_assignments_due_date ON turkus_unified_assignments(due_date);
CREATE INDEX idx_turkus_unified_assignments_department ON turkus_unified_assignments(department_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_turkus_unified_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_turkus_unified_assignments_updated_at
    BEFORE UPDATE ON turkus_unified_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_turkus_unified_assignments_updated_at();

-- 2. Data migration from existing tables
-- Handle duplicates during migration by using INSERT ... ON CONFLICT

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
    COALESCE(created_at, now()) as created_at, -- fallback if no created_at
    jsonb_build_object('auth_id_legacy', "auth-id") as metadata -- preserve legacy field
FROM turkus_assignments
WHERE task_id IS NOT NULL AND user_auth_id IS NOT NULL
ORDER BY task_id, user_auth_id, created_at DESC NULLS LAST
ON CONFLICT (assignment_type, reference_id, assigned_to) DO NOTHING;

-- 3. Views for backward compatibility
-- Risk assignments view
CREATE VIEW turkus_risk_assignments_view AS
SELECT 
    id,
    reference_id as risk_id,
    assigned_to as auth_id,
    created_at as assigned_at
FROM turkus_unified_assignments
WHERE assignment_type = 'risk';

-- Task assignments view  
CREATE VIEW turkus_assignments_view AS
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
    created_at
FROM turkus_unified_assignments
WHERE assignment_type = 'task';

-- 4. Helper functions for common operations

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
    status TEXT,
    priority TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
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
            ELSE 'Unknown'
        END as title,
        ua.status,
        ua.priority,
        ua.due_date,
        ua.created_at,
        ua.metadata
    FROM turkus_unified_assignments ua
    LEFT JOIN turkus_risks r ON ua.assignment_type = 'risk' AND ua.reference_id = r.id
    LEFT JOIN turkus_tasks t ON ua.assignment_type = 'task' AND ua.reference_id = t.id
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

-- 5. Sample queries for common use cases

-- Get all risk assignments for a user
-- SELECT * FROM get_user_turkus_assignments('user-auth-id', 'risk');

-- Get overdue assignments
-- SELECT * FROM turkus_unified_assignments 
-- WHERE status IN ('assigned', 'in_progress') 
--   AND due_date < now();

-- Assign a risk to a user
-- SELECT assign_turkus_item('risk', 'risk-uuid', 'user-auth-id', 'assigner-auth-id', 'dept-id', '2024-12-01');

-- Complete an assignment
-- SELECT complete_turkus_assignment('assignment-uuid', 'Task completed successfully');

COMMENT ON TABLE turkus_unified_assignments IS 'Unified table for all Turkus assignments (risks, tasks, audits, non-conformances, issues)';
COMMENT ON COLUMN turkus_unified_assignments.assignment_type IS 'Type of assignment: risk, task, audit, non_conformance, issue';
COMMENT ON COLUMN turkus_unified_assignments.reference_id IS 'ID of the assigned item (references turkus_risks.id, turkus_tasks.id, etc.)';
COMMENT ON COLUMN turkus_unified_assignments.metadata IS 'Flexible JSON field for type-specific data and legacy field preservation';
