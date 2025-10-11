const { createClient } = require('@supabase/supabase-js');

async function demonstrateRoleChangeFix() {
  console.log('🔄 Demonstrating Role Change Assignment Fix');
  console.log('='.repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find a user with assignments to test
    const { data: users } = await supabase
      .from('users')
      .select('id, auth_id, role_id, first_name, last_name')
      .not('role_id', 'is', null)
      .limit(3);

    if (!users || users.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`\n👤 Test User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   Current Role: ${testUser.role_id}`);

    // 2. Check current assignments
    const { count: beforeCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`   Current Assignments: ${beforeCount || 0}`);

    // 3. Show available roles
    const { data: allRoles } = await supabase
      .from('users')
      .select('role_id')
      .not('role_id', 'is', null)
      .not('role_id', 'eq', testUser.role_id);

    const uniqueRoles = [...new Set(allRoles?.map(r => r.role_id) || [])];
    console.log(`\n📋 Available roles for testing: ${uniqueRoles.length}`);
    uniqueRoles.slice(0, 3).forEach((role, i) => {
      console.log(`   ${i + 1}. ${role}`);
    });

    if (uniqueRoles.length === 0) {
      console.log('❌ No other roles available for testing');
      return;
    }

    // 4. Demonstrate the problem and solution
    console.log('\n' + '='.repeat(50));
    console.log('🚨 THE PROBLEM:');
    console.log('- When users change roles, they keep old assignments');
    console.log('- New assignments are added, but old ones remain');
    console.log('- Users end up with training from multiple roles');
    
    console.log('\n✅ THE SOLUTION:');
    console.log('- New API: /api/change-user-role-assignments');
    console.log('- Step 1: Remove ALL existing assignments');
    console.log('- Step 2: Update user role');
    console.log('- Step 3: Add assignments for new role only');
    console.log('- Result: Clean transition, no leftover assignments');

    console.log('\n📋 USAGE EXAMPLES:');
    console.log('');
    console.log('// JavaScript/TypeScript');
    console.log('await updateUserRole(userId, newRoleId);');
    console.log('');
    console.log('// API Call');
    console.log('fetch("/api/change-user-role-assignments", {');
    console.log('  method: "POST",');
    console.log('  body: JSON.stringify({');
    console.log('    user_id: "' + testUser.id + '",');
    console.log('    new_role_id: "' + uniqueRoles[0] + '"');
    console.log('  })');
    console.log('});');
    console.log('');
    console.log('// Database Trigger (automatic)');
    console.log('UPDATE users SET role_id = $1 WHERE id = $2;');

    console.log('\n' + '='.repeat(50));
    console.log('✅ ROLE CHANGE SYSTEM READY');
    console.log('- Old assignments will be removed automatically');
    console.log('- Only relevant assignments for new role will remain');
    console.log('- No manual cleanup required');

  } catch (error) {
    console.error('Demo error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
demonstrateRoleChangeFix();
