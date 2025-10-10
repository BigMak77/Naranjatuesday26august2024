import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAssignments() {
  console.log('🔍 Checking assignment status...\n');

  try {
    // Get total counts
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: roleAssignmentCount } = await supabase
      .from('role_assignments')
      .select('*', { count: 'exact', head: true });

    const { count: userAssignmentCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Summary:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Role assignments: ${roleAssignmentCount}`);
    console.log(`   User assignments: ${userAssignmentCount}\n`);

    // Check for users without assignments
    const { data: usersWithoutAssignments } = await supabase
      .from('users')
      .select(`
        auth_id,
        email,
        first_name,
        last_name,
        role_id,
        roles(title)
      `)
      .not('role_id', 'is', null);

    if (usersWithoutAssignments) {
      const usersNeedingBackfill = [];
      
      for (const user of usersWithoutAssignments) {
        // Check if this user has any assignments
        const { count: existingAssignments } = await supabase
          .from('user_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('auth_id', user.auth_id);

        // Check if their role has any assignments
        const { count: roleAssignments } = await supabase
          .from('role_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('role_id', user.role_id);

        if (roleAssignments && roleAssignments > 0 && existingAssignments === 0) {
          usersNeedingBackfill.push({
            ...user,
            roleAssignments,
            userAssignments: existingAssignments
          });
        }
      }

      if (usersNeedingBackfill.length > 0) {
        console.log(`⚠️  Found ${usersNeedingBackfill.length} users needing backfill:\n`);
        
        for (const user of usersNeedingBackfill) {
          console.log(`   ${user.first_name} ${user.last_name} (${user.email})`);
          console.log(`   Role: ${Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0].title : 'Unknown'}`);
          console.log(`   Role has ${user.roleAssignments} assignments, user has ${user.userAssignments}`);
          console.log('');
        }
      } else {
        console.log('✅ All users with roles have proper assignments!\n');
      }
    }

    // Check for role assignments by role
    const { data: roleStats } = await supabase
      .from('roles')
      .select(`
        id,
        title,
        role_assignments(count),
        users(count)
      `);

    if (roleStats) {
      console.log('📋 Role Assignment Stats:');
      for (const role of roleStats) {
        const assignmentCount = role.role_assignments?.length || 0;
        const userCount = role.users?.length || 0;
        console.log(`   ${role.title}: ${assignmentCount} assignments → ${userCount} users`);
      }
    }

  } catch (error) {
    console.error('Error checking assignments:', error);
  }
}

checkAssignments().catch(console.error);
