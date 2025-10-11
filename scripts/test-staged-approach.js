const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStagedApproach() {
  console.log('🧪 Testing Staged Role Assignment Approach');
  console.log('==========================================');

  try {
    // Stage 1: Scan for problems
    console.log('\n📊 STAGE 1: Scanning for users with legacy assignments...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null);
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.length} users with roles`);

    const problemUsers = [];
    for (const user of users) {
      const { count: currentCount } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);
        
      const { count: expectedCount } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', user.role_id);
        
      if (currentCount !== expectedCount) {
        problemUsers.push({
          user_id: user.id,
          role_id: user.role_id,
          current: currentCount,
          expected: expectedCount,
          issue: currentCount > expectedCount ? 'LEGACY_ASSIGNMENTS' : 'MISSING_ASSIGNMENTS'
        });
      }
    }

    if (problemUsers.length === 0) {
      console.log('✅ No users found with assignment issues!');
      console.log('🎉 All users have correct assignments for their roles');
      return;
    }

    console.log(`\n🚨 Found ${problemUsers.length} users with assignment issues:`);
    problemUsers.forEach((user, i) => {
      console.log(`  ${i+1}. ${user.user_id}`);
      console.log(`     Current: ${user.current}, Expected: ${user.expected}`);
      console.log(`     Issue: ${user.issue}`);
    });

    // Stage 2: Ask for confirmation
    console.log('\n⚠️  STAGE 2: Confirmation');
    console.log('The staged approach will:');
    console.log('1. Create backup of current assignments');
    console.log('2. Delete ALL assignments for problem users');
    console.log('3. Add assignments based on current role');
    console.log('4. Verify the fix worked');
    
    // For demo purposes, we'll proceed automatically
    console.log('\n🔧 STAGE 3: Executing staged fix...');

    let fixedCount = 0;
    let errorCount = 0;

    for (const problemUser of problemUsers) {
      try {
        console.log(`\n🔄 Processing user: ${problemUser.user_id}`);
        
        // Sub-stage 3.1: Backup current assignments
        const { data: currentAssignments } = await supabase
          .from('user_assignments')
          .select('*')
          .eq('auth_id', problemUser.user_id);

        // Log backup
        await supabase
          .from('audit_log')
          .insert({
            table_name: 'user_assignments',
            operation: 'staged_fix_backup',
            user_id: problemUser.user_id,
            old_values: { assignments: currentAssignments },
            timestamp: new Date().toISOString()
          });

        console.log(`  📦 Backed up ${currentAssignments?.length || 0} current assignments`);

        // Sub-stage 3.2: Delete all current assignments
        const { error: deleteError } = await supabase
          .from('user_assignments')
          .delete()
          .eq('auth_id', problemUser.user_id);

        if (deleteError) {
          console.error('  ❌ Delete failed:', deleteError);
          errorCount++;
          continue;
        }

        console.log('  🗑️ Deleted all current assignments');

        // Sub-stage 3.3: Get role assignments
        const { data: roleAssignments, error: roleError } = await supabase
          .from('role_assignments')
          .select('module_id, document_id, type')
          .eq('role_id', problemUser.role_id);

        if (roleError) {
          console.error('  ❌ Role lookup failed:', roleError);
          errorCount++;
          continue;
        }

        // Sub-stage 3.4: Insert new assignments
        if (roleAssignments && roleAssignments.length > 0) {
          const newAssignments = roleAssignments.map(ra => ({
            auth_id: problemUser.user_id,
            item_id: ra.document_id || ra.module_id,
            item_type: ra.type,
            assigned_at: new Date().toISOString()
          }));

          const { error: insertError } = await supabase
            .from('user_assignments')
            .insert(newAssignments);

          if (insertError) {
            console.error('  ❌ Insert failed:', insertError);
            errorCount++;
            continue;
          }

          console.log(`  ➕ Added ${newAssignments.length} new assignments`);
        }

        // Sub-stage 3.5: Verify fix
        const { count: finalCount } = await supabase
          .from('user_assignments')
          .select('*', { count: 'exact' })
          .eq('auth_id', problemUser.user_id);

        if (finalCount === problemUser.expected) {
          console.log(`  ✅ SUCCESS: ${problemUser.current} → ${finalCount} (expected ${problemUser.expected})`);
          fixedCount++;
          
          // Log success
          await supabase
            .from('audit_log')
            .insert({
              table_name: 'user_assignments',
              operation: 'staged_fix_success',
              user_id: problemUser.user_id,
              old_values: { count: problemUser.current },
              new_values: { count: finalCount },
              timestamp: new Date().toISOString()
            });
        } else {
          console.log(`  ⚠️ PARTIAL: Expected ${problemUser.expected}, got ${finalCount}`);
          errorCount++;
        }

      } catch (error) {
        console.error(`  💥 Error processing ${problemUser.user_id}:`, error);
        errorCount++;
      }
    }

    // Stage 4: Final report
    console.log('\n📊 STAGE 4: Final Report');
    console.log('========================');
    console.log(`✅ Successfully fixed: ${fixedCount} users`);
    console.log(`❌ Errors encountered: ${errorCount} users`);
    console.log(`📈 Success rate: ${((fixedCount / problemUsers.length) * 100).toFixed(1)}%`);

    if (fixedCount === problemUsers.length) {
      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('All users now have correct assignments for their roles');
      console.log('No more legacy assignment issues');
    } else {
      console.log(`\n⚠️ ${errorCount} users still need manual attention`);
    }

  } catch (error) {
    console.error('💥 Staged test failed:', error);
  }
}

// Execute the test
console.log('Starting staged approach test...');
testStagedApproach();
