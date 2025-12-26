// Temporary script to fix trigger conflicts
// Run with: node fix-triggers.js

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sql = `
-- Drop and recreate the department training trigger to NOT fire on role_id changes
DROP TRIGGER IF EXISTS trigger_sync_department_training_on_update ON users;

CREATE TRIGGER trigger_sync_department_training_on_update
AFTER UPDATE OF department_id ON users
FOR EACH ROW
WHEN (OLD.department_id IS DISTINCT FROM NEW.department_id)
EXECUTE FUNCTION sync_department_training_to_user();
`

async function fixTriggers() {
  console.log('Fixing department training trigger...')

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('Success! Trigger conflict fixed.')
  console.log('The department training trigger now only fires on department_id changes,')
  console.log('not on role_id changes, which prevents conflicts with the role training trigger.')
}

fixTriggers()
