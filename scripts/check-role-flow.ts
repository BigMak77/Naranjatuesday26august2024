import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoleFlow() {
  console.log('🔍 Checking role assignment flow...\n');

  try {
    // Get roles with their embedded modules/documents
    const { data: roles } = await supabase
      .from('roles')
      .select('*');

    console.log(`📊 Total roles: ${roles?.length || 0}`);

    // Check role_assignments
    const { count: roleAssignmentCount } = await supabase
      .from('role_assignments')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Role assignments in role_assignments table: ${roleAssignmentCount}`);

    // Check if we need to migrate from roles table to role_assignments table
    const rolesWithData = roles?.filter(r =>
      (Array.isArray(r.modules) && r.modules.length > 0) ||
      (Array.isArray(r.documents) && r.documents.length > 0)
    ) || [];

    if (rolesWithData.length > 0) {
      console.log(`\n⚠️  Found ${rolesWithData.length} roles with embedded modules/documents that need migration to role_assignments table:`);
      
      for (const role of rolesWithData) {
        console.log(`   - ${role.title}:`);
        if (Array.isArray(role.modules) && role.modules.length > 0) {
          console.log(`     Modules: ${role.modules.length}`);
        }
        if (Array.isArray(role.documents) && role.documents.length > 0) {
          console.log(`     Documents: ${role.documents.length}`);
        }
      }
    } else {
      console.log('\n✅ No roles with embedded modules/documents found (good!)');
    }

    // Check user assignments
    const { count: userAssignmentCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact', head: true });

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('role_id', 'is', null);

    console.log(`\n📊 User assignments: ${userAssignmentCount}`);
    console.log(`📊 Users with roles: ${totalUsers}`);

    // Expected user assignments calculation
    if (roleAssignmentCount && totalUsers) {
      // This is a rough estimate - actual calculation would need role distribution
      console.log(`\n💭 If all users had assignments based on their roles, we might expect more user assignments`);
    }

    // Check specific role assignment distribution
    const { data: roleStats } = await supabase
      .from('roles')
      .select(`
        id,
        title,
        role_assignments(count),
        users(count)
      `);

    if (roleStats && roleStats.length > 0) {
      console.log(`\n📋 Role-wise breakdown:`);
      for (const role of roleStats) {
        const assignmentCount = Array.isArray(role.role_assignments) ? role.role_assignments.length : 0;
        const userCount = Array.isArray(role.users) ? role.users.length : 0;
        
        if (assignmentCount > 0 || userCount > 0) {
          console.log(`   ${role.title}: ${assignmentCount} role assignments → ${userCount} users`);
          if (assignmentCount > 0 && userCount > 0) {
            console.log(`     Expected user assignments: ${assignmentCount * userCount}`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error checking role flow:', error);
  }
}

checkRoleFlow().catch(console.error);
