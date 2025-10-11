-- Create archived_assignments table to track assignments that were removed during role changes
-- This provides full audit trail of what assignments users had and why they were removed

CREATE TABLE IF NOT EXISTS archived_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    auth_id TEXT NOT NULL,
    item_id UUID NOT NULL,
    item_type TEXT NOT NULL,
    original_assigned_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT NOT NULL, -- e.g., 'role_change_not_applicable', 'manual_removal', etc.
    old_role_id UUID,
    new_role_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_archived_assignments_user_id ON archived_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_assignments_auth_id ON archived_assignments(auth_id);
CREATE INDEX IF NOT EXISTS idx_archived_assignments_archived_at ON archived_assignments(archived_at);
CREATE INDEX IF NOT EXISTS idx_archived_assignments_reason ON archived_assignments(reason);

-- Add RLS policy (adjust based on your security needs)
ALTER TABLE archived_assignments ENABLE ROW LEVEL SECURITY;

-- Example policy - adjust based on your authentication setup
CREATE POLICY "Allow authenticated users to view archived assignments" 
ON archived_assignments FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow service role to manage archived assignments"
ON archived_assignments FOR ALL
TO service_role
USING (true);

-- Add comment
COMMENT ON TABLE archived_assignments IS 'Stores assignments that were removed during role changes or other operations for audit purposes';

SELECT 'archived_assignments table created successfully' as result;
