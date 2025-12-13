import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateModuleCoverage() {
  console.log('🔍 INVESTIGATING MODULE COVERAGE\n');
  console.log('=' .repeat(80));

  // 1. Get all modules
  const { data: modules } = await supabase
    .from('modules')
    .select('id, name, ref_code, is_archived')
    .order('name');

  console.log(`\n📚 TOTAL MODULES: ${modules?.length || 0}`);
  console.log('─'.repeat(80));

  const activeModules = modules?.filter(m => !m.is_archived) || [];
  const archivedModules = modules?.filter(m => m.is_archived) || [];

  console.log(`Active modules: ${activeModules.length}`);
  console.log(`Archived modules: ${archivedModules.length}`);

  // 2. Get all role assignments
  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('role_id, item_id, type');

  const roleModuleAssignments = roleAssignments?.filter(ra => ra.type === 'module') || [];
  const roleDocumentAssignments = roleAssignments?.filter(ra => ra.type === 'document') || [];

  console.log(`\n📋 ROLE ASSIGNMENTS:`);
  console.log(`  Modules: ${roleModuleAssignments.length}`);
  console.log(`  Documents: ${roleDocumentAssignments.length}`);
  console.log(`  Total: ${roleAssignments?.length || 0}`);

  // 3. Get all department assignments
  const { data: deptAssignments } = await supabase
    .from('department_assignments')
    .select('department_id, item_id, type');

  const deptModuleAssignments = deptAssignments?.filter(da => da.type === 'module') || [];
  const deptDocumentAssignments = deptAssignments?.filter(da => da.type === 'document') || [];

  console.log(`\n🏢 DEPARTMENT ASSIGNMENTS:`);
  console.log(`  Modules: ${deptModuleAssignments.length}`);
  console.log(`  Documents: ${deptDocumentAssignments.length}`);
  console.log(`  Total: ${deptAssignments?.length || 0}`);

  // 4. Get roles
  const { data: roles } = await supabase
    .from('roles')
    .select('id, title')
    .order('title');

  console.log(`\n👔 TOTAL ROLES: ${roles?.length || 0}`);

  // 5. Which modules are assigned to roles?
  console.log('\n' + '='.repeat(80));
  console.log('MODULES ASSIGNED TO ROLES');
  console.log('='.repeat(80));

  const assignedModuleIds = new Set(roleModuleAssignments.map(ra => ra.item_id));
  const unassignedModules = activeModules.filter(m => !assignedModuleIds.has(m.id));

  if (roleModuleAssignments.length === 0) {
    console.log('\n❌ NO MODULES ARE ASSIGNED TO ANY ROLES!');
  } else {
    console.log(`\n✅ ${roleModuleAssignments.length} module-role assignments found:\n`);

    // Group by module
    const moduleAssignments = new Map<string, string[]>();
    roleModuleAssignments.forEach(ra => {
      if (!moduleAssignments.has(ra.item_id)) {
        moduleAssignments.set(ra.item_id, []);
      }
      moduleAssignments.get(ra.item_id)!.push(ra.role_id);
    });

    for (const [moduleId, roleIds] of moduleAssignments) {
      const module = modules?.find(m => m.id === moduleId);
      console.log(`📦 ${module?.name || 'Unknown'} (${module?.ref_code || 'no ref'})`);
      console.log(`   Assigned to ${roleIds.length} role(s):`);
      roleIds.forEach(roleId => {
        const role = roles?.find(r => r.id === roleId);
        console.log(`     - ${role?.title || 'Unknown'}`);
      });
      console.log();
    }
  }

  // 6. Unassigned modules
  console.log('='.repeat(80));
  console.log('UNASSIGNED MODULES (not assigned to any role)');
  console.log('='.repeat(80));

  if (unassignedModules.length === 0) {
    console.log('\n✅ All active modules are assigned to at least one role');
  } else {
    console.log(`\n⚠️  ${unassignedModules.length} active modules are NOT assigned to any role:\n`);
    unassignedModules.forEach(m => {
      console.log(`  ❌ ${m.name} (${m.ref_code || 'no ref'})`);
    });
  }

  // 7. Roles without module assignments
  console.log('\n' + '='.repeat(80));
  console.log('ROLES WITHOUT MODULE ASSIGNMENTS');
  console.log('='.repeat(80));

  const rolesWithModules = new Set(roleModuleAssignments.map(ra => ra.role_id));
  const rolesWithoutModules = roles?.filter(r => !rolesWithModules.has(r.id)) || [];

  if (rolesWithoutModules.length === 0) {
    console.log('\n✅ All roles have at least one module assigned');
  } else {
    console.log(`\n⚠️  ${rolesWithoutModules.length} roles have NO modules assigned:\n`);
    rolesWithoutModules.forEach(r => {
      console.log(`  - ${r.title}`);
    });
  }

  // 8. Get user counts per role
  console.log('\n' + '='.repeat(80));
  console.log('USERS PER ROLE (for roles with modules)');
  console.log('='.repeat(80));

  const rolesWithAssignments = Array.from(rolesWithModules);
  for (const roleId of rolesWithAssignments) {
    const role = roles?.find(r => r.id === roleId);
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId)
      .not('auth_id', 'is', null);

    const moduleCount = roleModuleAssignments.filter(ra => ra.role_id === roleId).length;
    console.log(`\n👔 ${role?.title || 'Unknown'}`);
    console.log(`   Users: ${count || 0}`);
    console.log(`   Modules: ${moduleCount}`);
  }

  // 9. Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n📊 Coverage Statistics:`);
  console.log(`  Total active modules: ${activeModules.length}`);
  console.log(`  Modules assigned to roles: ${assignedModuleIds.size}`);
  console.log(`  Modules NOT assigned: ${unassignedModules.length}`);
  console.log(`  Coverage: ${((assignedModuleIds.size / activeModules.length) * 100).toFixed(1)}%`);

  console.log(`\n👔 Role Statistics:`);
  console.log(`  Total roles: ${roles?.length || 0}`);
  console.log(`  Roles with modules: ${rolesWithModules.size}`);
  console.log(`  Roles without modules: ${rolesWithoutModules.length}`);

  if (unassignedModules.length > 0) {
    console.log('\n⚠️  ISSUE IDENTIFIED:');
    console.log(`  ${unassignedModules.length} modules exist but are not assigned to any roles.`);
    console.log('  Users in those roles will NOT inherit these modules.');
    console.log('\n💡 SOLUTION:');
    console.log('  Use the Bulk Module Assignment UI to assign modules to roles:');
    console.log('  - Navigate to the module assignment interface');
    console.log('  - Select each unassigned module');
    console.log('  - Assign to appropriate roles');
  }

  console.log('\n' + '='.repeat(80));
}

investigateModuleCoverage()
  .then(() => {
    console.log('\n✅ Investigation complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
