#!/bin/bash
# Apply user_assignments RLS fix

echo "Applying user_assignments RLS fix..."

psql "$SUPABASE_DB_URL" <<'EOF'
-- Enable RLS
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can view own training" ON user_assignments;
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON user_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON user_assignments;

-- Allow authenticated users to view ALL assignments (needed for trainers/admins)
CREATE POLICY "Authenticated users can view all assignments"
  ON user_assignments
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to update their own assignments
CREATE POLICY "Users can update own assignments"
  ON user_assignments
  FOR UPDATE
  TO authenticated
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Grant permissions
GRANT SELECT ON user_assignments TO authenticated, anon;
GRANT UPDATE ON user_assignments TO authenticated;

SELECT 'RLS fix applied successfully!' as status;
EOF

echo "Done!"
