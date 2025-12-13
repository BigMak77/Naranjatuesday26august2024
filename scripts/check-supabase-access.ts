/**
 * Check Supabase access and RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('🔍 CHECKING SUPABASE ACCESS\n');
console.log('Environment variables:');
console.log('  SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('  SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
console.log('  ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
console.log();

async function checkAccess() {
  try {
    // Test 1: Service role client (what we've been using)
    console.log('═'.repeat(60));
    console.log('TEST 1: Service Role Client (admin access)');
    console.log('═'.repeat(60));

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: gailAdmin, error: gailAdminError } = await adminClient
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('first_name', 'Gail')
      .eq('last_name', 'Cue')
      .single();

    if (gailAdminError) {
      console.log('❌ Error fetching Gail:', gailAdminError.message);
    } else {
      console.log('✅ Found Gail Cue');

      const { data: assignmentsAdmin, error: assignmentsAdminError } = await adminClient
        .from('user_assignments')
        .select('item_id, item_type')
        .eq('auth_id', gailAdmin.auth_id);

      if (assignmentsAdminError) {
        console.log('❌ Error fetching assignments:', assignmentsAdminError.message);
      } else {
        console.log(`✅ Gail has ${assignmentsAdmin?.length || 0} assignments (admin client)`);
      }
    }

    // Test 2: Anon client (what the UI uses)
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 2: Anonymous Client (what the UI uses)');
    console.log('═'.repeat(60));

    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: gailAnon, error: gailAnonError } = await anonClient
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('first_name', 'Gail')
      .eq('last_name', 'Cue')
      .single();

    if (gailAnonError) {
      console.log('❌ Error fetching Gail (anon):', gailAnonError.message);
      console.log('   This suggests RLS is blocking reads!');
    } else {
      console.log('✅ Found Gail Cue (anon client)');

      const { data: assignmentsAnon, error: assignmentsAnonError } = await anonClient
        .from('user_assignments')
        .select('item_id, item_type')
        .eq('auth_id', gailAnon.auth_id);

      if (assignmentsAnonError) {
        console.log('❌ Error fetching assignments (anon):', assignmentsAnonError.message);
        console.log('   ⚠️  RLS POLICY IS BLOCKING user_assignments reads!');
      } else {
        console.log(`✅ Gail has ${assignmentsAnon?.length || 0} assignments (anon client)`);
      }
    }

    // Test 3: Check RLS status
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 3: Check RLS Policies');
    console.log('═'.repeat(60));

    const { data: rlsCheck } = await adminClient
      .rpc('check_rls_policies')
      .catch(() => ({ data: null, error: 'RPC not available' }));

    console.log('\nTo check RLS policies manually, run this SQL:');
    console.log(`
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('users', 'user_assignments', 'role_assignments', 'department_assignments')
ORDER BY tablename, policyname;
    `);

    // Test 4: Simulate Training Matrix query
    console.log('\n' + '═'.repeat(60));
    console.log('TEST 4: Simulate Training Matrix Query (anon client)');
    console.log('═'.repeat(60));

    const [
      usersRes,
      assignmentsRes,
      roleAssignmentsRes,
      deptAssignmentsRes
    ] = await Promise.all([
      anonClient.from('users').select('auth_id, first_name, last_name, department_id, role_id').limit(5),
      anonClient.from('user_assignments').select('auth_id, item_id, item_type, completed_at').limit(10),
      anonClient.from('role_assignments').select('role_id, item_id, type').limit(10),
      anonClient.from('department_assignments').select('department_id, item_id, type').limit(10)
    ]);

    console.log('\nResults:');
    console.log('  Users:', usersRes.error ? `❌ ${usersRes.error.message}` : `✅ ${usersRes.data?.length} fetched`);
    console.log('  User Assignments:', assignmentsRes.error ? `❌ ${assignmentsRes.error.message}` : `✅ ${assignmentsRes.data?.length} fetched`);
    console.log('  Role Assignments:', roleAssignmentsRes.error ? `❌ ${roleAssignmentsRes.error.message}` : `✅ ${roleAssignmentsRes.data?.length} fetched`);
    console.log('  Dept Assignments:', deptAssignmentsRes.error ? `❌ ${deptAssignmentsRes.error.message}` : `✅ ${deptAssignmentsRes.data?.length} fetched`);

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('DIAGNOSIS SUMMARY');
    console.log('═'.repeat(60));

    if (assignmentsRes.error) {
      console.log('\n❌ PROBLEM FOUND: RLS policies are blocking user_assignments reads');
      console.log('\nThe Training Matrix cannot read user_assignments because:');
      console.log('1. RLS (Row Level Security) is enabled on user_assignments table');
      console.log('2. There is no policy allowing anonymous/authenticated users to read');
      console.log('\nSOLUTION: Add an RLS policy to allow reads on user_assignments');
      console.log('\nSQL to fix:');
      console.log(`
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read user assignments"
ON user_assignments
FOR SELECT
TO authenticated
USING (true);
      `);
    } else {
      console.log('\n✅ All queries successful - Supabase access is working correctly');
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
  }
}

checkAccess();
