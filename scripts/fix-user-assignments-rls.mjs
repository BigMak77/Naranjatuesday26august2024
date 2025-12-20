#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUserAssignmentsRLS() {
  console.log('🔧 Fixing user_assignments RLS policies...\n');

  const sql = `
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
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Error applying RLS fix:', error);
    console.log('\n💡 Trying alternative method...\n');

    // Try using the raw SQL endpoint
    const { error: directError } = await supabase
      .from('user_assignments')
      .select('id')
      .limit(1);

    if (directError) {
      console.error('❌ Direct query also failed:', directError.message);
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
      console.log('---------------------------------------------------');
      console.log(sql);
      console.log('---------------------------------------------------');
      process.exit(1);
    }
  } else {
    console.log('✅ RLS policies updated successfully!');
    console.log('\n📋 Applied changes:');
    console.log('  - Enabled RLS on user_assignments table');
    console.log('  - Created policy: "Authenticated users can view all assignments"');
    console.log('  - Created policy: "Users can update own assignments"');
    console.log('  - Granted SELECT to authenticated and anon roles');
    console.log('  - Granted UPDATE to authenticated role');
  }
}

fixUserAssignmentsRLS().catch(console.error);
