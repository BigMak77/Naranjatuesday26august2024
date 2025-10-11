const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function bulkFixLegacyAssignments() {
  console.log('🚨 BULK FIX: Cleaning up all legacy assignments...');
  
  try {
    // Step 1: Find all users with mismatched assignments
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null);
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Scanning ${users.length} users...`);
    
    const problemUsers = [];
    
    // Find users with mismatched assignments  
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
          ...user,
          current_assignments: currentCount,
          expected_assignments: expectedCount
        });
      }
    }
    
    if (problemUsers.length === 0) {
      console.log('✅ No users found with legacy assignments!');
      console.log('🎉 All users already have correct assignments');
      return;
    }
    
    console.log(`🚨 Found ${problemUsers.length} users with legacy assignments:`);
    problemUsers.forEach((user, i) => {
      console.log(`  ${i+1}. ${user.id}: ${user.current_assignments} → ${user.expected_assignments}`);
    });
    
    console.log('\\n🔧 Starting bulk fix...');
    
    let fixedCount = 0;
    let errorCount = 0;
    
    // Step 2: Fix each user
    for (const user of problemUsers) {
      try {
        console.log(`\\n🔄 Fixing user ${user.id}...`);
        
        // Delete all current assignments
        const { error: deleteError } = await supabase
          .from('user_assignments')
          .delete()
          .eq('auth_id', user.auth_id);
          
        if (deleteError) {
          console.error(`❌ Delete failed for ${user.id}:`, deleteError);
          errorCount++;
          continue;
        }
        
        // Get role assignments
        const { data: roleAssignments, error: roleError } = await supabase
          .from('role_assignments')
          .select('module_id, document_id, type')
          .eq('role_id', user.role_id);
          
        if (roleError) {
          console.error(`❌ Role lookup failed for ${user.id}:`, roleError);
          errorCount++;
          continue;
        }
        
        // Insert new assignments
        if (roleAssignments.length > 0) {
          const newAssignments = roleAssignments.map(ra => ({
            auth_id: user.auth_id,
            item_id: ra.document_id || ra.module_id,
            item_type: ra.type,
            assigned_at: new Date().toISOString()
          }));
          
          const { error: insertError } = await supabase
            .from('user_assignments')
            .insert(newAssignments);
            
          if (insertError) {
            console.error(`❌ Insert failed for ${user.id}:`, insertError);
            errorCount++;
            continue;
          }
        }
        
        // Verify fix
        const { count: finalCount } = await supabase
          .from('user_assignments')
          .select('*', { count: 'exact' })
          .eq('auth_id', user.auth_id);
          
        if (finalCount === user.expected_assignments) {
          console.log(`✅ Fixed ${user.id}: ${user.current_assignments} → ${finalCount}`);
          fixedCount++;
          
          // Log the fix
          await supabase
            .from('audit_log')
            .insert({
              table_name: 'user_assignments',
              operation: 'bulk_legacy_fix',
              user_id: user.id,
              old_values: { count: user.current_assignments },
              new_values: { count: finalCount },
              timestamp: new Date().toISOString()
            });
        } else {
          console.log(`⚠️ Partial fix ${user.id}: expected ${user.expected_assignments}, got ${finalCount}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`💥 Error fixing ${user.id}:`, error);
        errorCount++;
      }
    }
    
    // Step 3: Final summary
    console.log('\\n🎉 BULK FIX COMPLETED!');
    console.log('========================');
    console.log(`✅ Successfully fixed: ${fixedCount} users`);
    console.log(`❌ Errors encountered: ${errorCount} users`);
    console.log(`📊 Total processed: ${problemUsers.length} users`);
    
    if (fixedCount === problemUsers.length) {
      console.log('\\n🎉 ALL USERS FIXED! No more legacy assignments.');
      console.log('🔒 Users now have correct training assignments for their roles.');
    } else {
      console.log(`\\n⚠️ ${errorCount} users still need manual attention.`);
    }
    
  } catch (error) {
    console.error('💥 Bulk fix crashed:', error);
  }
}

// Execute bulk fix
bulkFixLegacyAssignments();
