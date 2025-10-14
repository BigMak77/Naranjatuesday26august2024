-- Quick setup for permissions table
-- Copy and paste this into Supabase SQL Editor

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(key);

-- Insert default permissions
INSERT INTO permissions (key, category, description) VALUES
  ('admin:dashboard', 'admin', 'Access admin dashboard'),
  ('admin:manage-users', 'admin', 'Create, edit, and delete users'),
  ('admin:manage-roles', 'admin', 'Create and manage roles'),
  ('admin:manage-departments', 'admin', 'Create and manage departments'),
  ('admin:manage-compliance', 'admin', 'Manage compliance settings'),
  ('super-manager:dashboard', 'super-manager', 'Access super manager dashboard'),
  ('super-manager:manage-users', 'super-manager', 'Manage users within scope'),
  ('super-manager:manage-roles', 'super-manager', 'Manage roles within scope'),
  ('super-manager:manage-departments', 'super-manager', 'Manage departments'),
  ('super-manager:manage-compliance', 'super-manager', 'Manage compliance'),
  ('manager:dashboard', 'manager', 'Access manager dashboard'),
  ('manager:manage-users', 'manager', 'Manage users in department'),
  ('manager:manage-roles', 'manager', 'Manage roles in department'),
  ('manager:manage-departments', 'manager', 'Manage department settings'),
  ('turkus:view', 'turkus', 'View Turkus documents and audits'),
  ('turkus:assign-task', 'turkus', 'Assign Turkus tasks to users'),
  ('turkus:manage-auditors', 'turkus', 'Manage auditors'),
  ('turkus:create-audit', 'turkus', 'Create new audits'),
  ('turkus:view-assignments', 'turkus', 'View task assignments'),
  ('health-safety:view', 'health-safety', 'View health and safety information'),
  ('health-safety:report-incident', 'health-safety', 'Report incidents'),
  ('health-safety:manage-firstaiders', 'health-safety', 'Manage first aiders'),
  ('health-safety:view-policies', 'health-safety', 'View H&S policies'),
  ('health-safety:view-risk-assessments', 'health-safety', 'View risk assessments'),
  ('health-safety:view-accidents', 'health-safety', 'View accident reports'),
  ('hr:view', 'hr', 'View HR information'),
  ('hr:manage', 'hr', 'Manage HR functions'),
  ('training:view', 'training', 'View training modules'),
  ('training:assign', 'training', 'Assign training to users')
ON CONFLICT (key) DO NOTHING;

-- Add trigger for updated_at
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
