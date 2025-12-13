import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyDepartmentTriggerFix() {
  console.log('🔧 APPLYING DEPARTMENT TRIGGER FIX\n');
  console.log('=' .repeat(80));

  const sql = `
-- Fix department training sync to use user's direct department_id
-- This replaces the previous logic that only looked at role's department

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_insert ON users;
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;

-- Recreate the function to use user's direct department_id
CREATE OR REPLACE FUNCTION sync_department_training_to_user()
RETURNS TRIGGER AS $$
DECLARE
  dept_id UUID;
  assignment_record RECORD;
BEGIN
  -- Skip if user has no auth_id
  IF NEW.auth_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Use the user's DIRECT department_id first
  -- This is the primary source of truth for department membership
  dept_id := NEW.department_id;

  -- If user has no direct department, try to get it from their role
  IF dept_id IS NULL AND NEW.role_id IS NOT NULL THEN
    SELECT department_id INTO dept_id
    FROM roles
    WHERE id = NEW.role_id;
  END IF;

  -- If still no department found, exit
  IF dept_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get all department assignments for this department
  FOR assignment_record IN
    SELECT id, item_id, type
    FROM department_assignments
    WHERE department_id = dept_id
  LOOP
    -- Insert user assignment if it doesn't already exist
    INSERT INTO user_assignments (auth_id, item_id, item_type, assigned_at)
    VALUES (NEW.auth_id, assignment_record.item_id, assignment_record.type, NOW())
    ON CONFLICT (auth_id, item_id, item_type) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync department training when a user is inserted
CREATE TRIGGER trigger_sync_department_training_on_insert
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION sync_department_training_to_user();

-- Trigger to sync department training when a user's department OR role changes
-- This now triggers on BOTH department_id and role_id changes
CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id, role_id ON users
FOR EACH ROW
WHEN (
  OLD.department_id IS DISTINCT FROM NEW.department_id OR
  OLD.role_id IS DISTINCT FROM NEW.role_id
)
EXECUTE FUNCTION sync_department_training_to_user();

-- Update the comment
COMMENT ON FUNCTION sync_department_training_to_user() IS
'Automatically assigns department-level training to users when they join or change departments.
Uses user''s direct department_id as primary source, falls back to role''s department if needed.
Triggers on both department_id and role_id changes.';
`;

  console.log('Executing SQL to update department trigger...\n');

  const { data, error } = await supabase.rpc('exec_sql' as any, { sql_string: sql });

  if (error) {
    console.error('❌ Error applying fix:', error.message);
    console.log('\nTrying alternative method: Direct SQL execution via API...\n');

    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      console.error('❌ Alternative method also failed');
      console.log('\n⚠️  You will need to apply this migration manually via Supabase Dashboard');
      console.log('\nGo to: Supabase Dashboard → SQL Editor');
      console.log('Run the SQL from: supabase/migrations/20251213_fix_department_training_sync.sql');
      process.exit(1);
    }
  }

  console.log('✅ Department trigger successfully updated!\n');
  console.log('=' .repeat(80));
  console.log('CHANGES APPLIED:');
  console.log('=' .repeat(80));

  console.log(`
✅ Department trigger now checks user's DIRECT department_id first
✅ Falls back to role's department if user has no direct department
✅ Triggers on BOTH department_id AND role_id changes

This means:
  • When a user changes departments → automatic training sync ✅
  • When a user changes roles → automatic training sync ✅
  • When a user is created → automatic training sync ✅
`);

  console.log('=' .repeat(80));
}

applyDepartmentTriggerFix()
  .then(() => {
    console.log('\n✅ Fix applied successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    console.log('\n⚠️  Please apply the migration manually via Supabase Dashboard');
    process.exit(1);
  });
