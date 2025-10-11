#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const commands = {
  scan: async () => {
    console.log('🔍 Scanning for users with legacy assignments...');
    
    const { data: users } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null);

    const problems = [];
    for (const user of users) {
      const { count: current } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);
        
      const { count: expected } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', user.role_id);
        
      if (current !== expected) {
        problems.push({ 
          id: user.id.substring(0, 8) + '...', 
          current, 
          expected,
          diff: current - expected 
        });
      }
    }

    console.log(`\nResults: ${problems.length}/${users.length} users have issues`);
    if (problems.length > 0) {
      console.table(problems);
    }
  },

  fix: async (userId) => {
    if (!userId) {
      console.log('Usage: node cli.js fix <user-id>');
      return;
    }

    console.log(`🔧 Fixing assignments for user: ${userId}`);
    
    const { data: user } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .eq('id', userId)
      .single();

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Delete all assignments
    await supabase
      .from('user_assignments')
      .delete()
      .eq('auth_id', user.auth_id);

    // Get role assignments
    const { data: roleAssignments } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', user.role_id);

    // Insert new assignments
    if (roleAssignments?.length > 0) {
      const newAssignments = roleAssignments.map(ra => ({
        auth_id: user.auth_id,
        item_id: ra.document_id || ra.module_id,
        item_type: ra.type,
        assigned_at: new Date().toISOString()
      }));

      await supabase
        .from('user_assignments')
        .insert(newAssignments);
    }

    console.log(`✅ Fixed! User now has ${roleAssignments?.length || 0} assignments`);
  },

  'bulk-fix': async () => {
    console.log('🚨 Bulk fixing all users with legacy assignments...');

    // Get problem users
    const { data: users } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null);

    const problemUsers = [];
    for (const user of users) {
      const { count: current } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);
        
      const { count: expected } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', user.role_id);
        
      if (current !== expected) {
        problemUsers.push(user);
      }
    }

    console.log(`Found ${problemUsers.length} users to fix`);

    let fixed = 0;
    for (const user of problemUsers) {
      try {
        // Delete all assignments
        await supabase
          .from('user_assignments')
          .delete()
          .eq('auth_id', user.auth_id);

        // Get role assignments
        const { data: roleAssignments } = await supabase
          .from('role_assignments')
          .select('module_id, document_id, type')
          .eq('role_id', user.role_id);

        // Insert new assignments
        if (roleAssignments?.length > 0) {
          const newAssignments = roleAssignments.map(ra => ({
            auth_id: user.auth_id,
            item_id: ra.document_id || ra.module_id,
            item_type: ra.type,
            assigned_at: new Date().toISOString()
          }));

          await supabase
            .from('user_assignments')
            .insert(newAssignments);
        }

        fixed++;
        console.log(`✅ Fixed user ${user.id.substring(0, 8)}...`);
      } catch (error) {
        console.log(`❌ Error fixing ${user.id.substring(0, 8)}...`);
      }
    }

    console.log(`\n🎉 Bulk fix completed! Fixed ${fixed}/${problemUsers.length} users`);
  }
};

// Parse command line arguments
const command = process.argv[2];
const arg = process.argv[3];

if (!command || !commands[command]) {
  console.log('Available commands:');
  console.log('  scan           - Find users with legacy assignments');
  console.log('  fix <user-id>  - Fix specific user');
  console.log('  bulk-fix       - Fix all users with issues');
  process.exit(1);
}

// Execute command
commands[command](arg).catch(console.error);
