-- Create permissions table to store available permissions that can be assigned to users
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g., 'admin:manage-users', 'turkus:view'
  category TEXT NOT NULL, -- e.g., 'admin', 'turkus', 'health-safety'
  description TEXT, -- Optional description of what this permission allows
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);

-- Insert default permissions based on existing userPermissions.ts
INSERT INTO permissions (key, category, description) VALUES
  -- Admin permissions
  ('admin:dashboard', 'admin', 'Access admin dashboard'),
  ('admin:manage-users', 'admin', 'Create, edit, and delete users'),
  ('admin:manage-roles', 'admin', 'Create and manage roles'),
  ('admin:manage-departments', 'admin', 'Create and manage departments'),
  ('admin:manage-compliance', 'admin', 'Manage compliance settings'),

  -- Super Manager permissions
  ('super-manager:dashboard', 'super-manager', 'Access super manager dashboard'),
  ('super-manager:manage-users', 'super-manager', 'Manage users within scope'),
  ('super-manager:manage-roles', 'super-manager', 'Manage roles within scope'),
  ('super-manager:manage-departments', 'super-manager', 'Manage departments'),
  ('super-manager:manage-compliance', 'super-manager', 'Manage compliance'),

  -- Manager permissions
  ('manager:dashboard', 'manager', 'Access manager dashboard'),
  ('manager:manage-users', 'manager', 'Manage users in department'),
  ('manager:manage-roles', 'manager', 'Manage roles in department'),
  ('manager:manage-departments', 'manager', 'Manage department settings'),

  -- Turkus permissions
  ('turkus:view', 'turkus', 'View Turkus documents and audits'),
  ('turkus:assign-task', 'turkus', 'Assign Turkus tasks to users'),
  ('turkus:manage-auditors', 'turkus', 'Manage auditors'),
  ('turkus:create-audit', 'turkus', 'Create new audits'),
  ('turkus:view-assignments', 'turkus', 'View task assignments'),

  -- Health & Safety permissions
  ('health-safety:view', 'health-safety', 'View health and safety information'),
  ('health-safety:report-incident', 'health-safety', 'Report incidents'),
  ('health-safety:manage-firstaiders', 'health-safety', 'Manage first aiders'),
  ('health-safety:view-policies', 'health-safety', 'View H&S policies'),
  ('health-safety:view-risk-assessments', 'health-safety', 'View risk assessments'),
  ('health-safety:view-accidents', 'health-safety', 'View accident reports'),

  -- HR permissions
  ('hr:view', 'hr', 'View HR information'),
  ('hr:manage', 'hr', 'Manage HR functions'),

  -- Training permissions
  ('training:view', 'training', 'View training modules'),
  ('training:assign', 'training', 'Assign training to users')
ON CONFLICT (key) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_permissions_updated_at();

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Example RLS policy - only admins can manage permissions
-- CREATE POLICY "Only admins can manage permissions"
--   ON permissions
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.auth_id = auth.uid()
--       AND 'admin:manage-roles' = ANY(users.permissions)
--     )
--   );
