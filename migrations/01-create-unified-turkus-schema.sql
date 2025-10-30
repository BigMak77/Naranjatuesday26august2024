-- ============================================
-- MIGRATION 01: CREATE UNIFIED TURKUS SCHEMA
-- ============================================
-- Purpose: Create unified table for all turkus assignments (risks, tasks, audits, non-conformances, issues)
-- This allows single source of truth for all assignment types
-- Safe to run: Creates new tables/views without dropping existing ones

-- 1. Create unified assignments table
CREATE TABLE IF NOT EXISTS turkus_unified_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Assignment type and reference
    assignment_type TEXT NOT NULL CHECK (assignment_type IN ('risk', 'task', 'audit', 'non_conformance', 'issue')),
    reference_id UUID NOT NULL, -- ID of the assigned item (risk_id, task_id, etc.)

    -- Assignment details
    assigned_to UUID NOT NULL REFERENCES users(auth_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(auth_id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,

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
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_type ON turkus_unified_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_assigned_to ON turkus_unified_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_reference ON turkus_unified_assignments(assignment_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_status ON turkus_unified_assignments(status);
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_due_date ON turkus_unified_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_turkus_unified_assignments_department ON turkus_unified_assignments(department_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_turkus_unified_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_turkus_unified_assignments_updated_at ON turkus_unified_assignments;
CREATE TRIGGER trigger_turkus_unified_assignments_updated_at
    BEFORE UPDATE ON turkus_unified_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_turkus_unified_assignments_updated_at();

-- Add comments
COMMENT ON TABLE turkus_unified_assignments IS 'Unified table for all Turkus assignments (risks, tasks, audits, non-conformances, issues)';
COMMENT ON COLUMN turkus_unified_assignments.assignment_type IS 'Type of assignment: risk, task, audit, non_conformance, issue';
COMMENT ON COLUMN turkus_unified_assignments.reference_id IS 'ID of the assigned item (references turkus_risks.id, turkus_tasks.id, etc.)';
COMMENT ON COLUMN turkus_unified_assignments.metadata IS 'Flexible JSON field for type-specific data and legacy field preservation';

-- 2. Create unified items table for non-task items (issues, non-conformances, audits)
CREATE TABLE IF NOT EXISTS turkus_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Item type
    item_type TEXT NOT NULL CHECK (item_type IN ('issue', 'non_conformance', 'audit')),

    -- Basic information
    title TEXT NOT NULL,
    description TEXT,

    -- Classification
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    category TEXT, -- flexible categorization

    -- Status tracking
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),

    -- Resolution
    resolved_by UUID REFERENCES users(auth_id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    -- Additional data
    metadata JSONB DEFAULT '{}'::jsonb,
    photo_urls TEXT[] DEFAULT '{}',

    -- Audit fields
    created_by UUID REFERENCES users(auth_id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for turkus_items
CREATE INDEX IF NOT EXISTS idx_turkus_items_type ON turkus_items(item_type);
CREATE INDEX IF NOT EXISTS idx_turkus_items_status ON turkus_items(status);
CREATE INDEX IF NOT EXISTS idx_turkus_items_department ON turkus_items(department_id);
CREATE INDEX IF NOT EXISTS idx_turkus_items_created_by ON turkus_items(created_by);

-- Trigger for updated_at on turkus_items
CREATE OR REPLACE FUNCTION update_turkus_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_turkus_items_updated_at ON turkus_items;
CREATE TRIGGER trigger_turkus_items_updated_at
    BEFORE UPDATE ON turkus_items
    FOR EACH ROW
    EXECUTE FUNCTION update_turkus_items_updated_at();

COMMENT ON TABLE turkus_items IS 'Unified table for issues, non-conformances, and audits';
COMMENT ON COLUMN turkus_items.item_type IS 'Type: issue, non_conformance, or audit';
COMMENT ON COLUMN turkus_items.metadata IS 'Flexible JSON field for type-specific data';
