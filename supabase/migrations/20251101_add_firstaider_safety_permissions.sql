-- Add new permissions for first aiders and safety representatives
-- This migration adds granular permissions for health & safety roles

-- Insert new permissions for first aiders
INSERT INTO permissions (key, category, description) VALUES
  ('health-safety:add-first-aid-report', 'health-safety', 'Add first aid reports and incidents'),
  ('health-safety:edit-first-aid-report', 'health-safety', 'Edit first aid reports'),
  ('health-safety:manage-first-aid', 'health-safety', 'Full first aid management capabilities'),

  -- Safety representative permissions
  ('health-safety:add-risk-assessment', 'health-safety', 'Create new risk assessments'),
  ('health-safety:edit-risk-assessment', 'health-safety', 'Edit and update risk assessments'),
  ('health-safety:manage-risk-assessments', 'health-safety', 'Full risk assessment management'),
  ('health-safety:approve-risk-assessment', 'health-safety', 'Approve or reject risk assessments')
ON CONFLICT (key) DO NOTHING;

-- Add comment explaining the new permissions
COMMENT ON TABLE permissions IS 'Stores granular permissions that can be assigned to users. Permissions follow the pattern category:action (e.g., health-safety:add-first-aid-report)';
