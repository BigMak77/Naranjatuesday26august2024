import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function fullBackfillProcess() {
  console.log("🚀 Starting full backfill process...\n");

  // STEP 1: Migrate from roles table to role_assignments table (if needed)
  console.log("📋 Step 1: Checking for embedded role data...");
  
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("*");
    
  if (rolesError) {
    console.error("Failed to fetch roles:", rolesError);
    return;
  }

  // Check for roles with embedded modules/documents
  const rolesWithEmbeddedData = roles?.filter(role => 
    (Array.isArray(role.modules) && role.modules.length > 0) ||
    (Array.isArray(role.documents) && role.documents.length > 0)
  ) || [];

  if (rolesWithEmbeddedData.length > 0) {
    console.log(`Found ${rolesWithEmbeddedData.length} roles with embedded data. Migrating...`);
    
    for (const role of rolesWithEmbeddedData) {
      const roleAssignments = [];
      
      // Add module assignments
      if (Array.isArray(role.modules)) {
        for (const moduleId of role.modules) {
          roleAssignments.push({
            role_id: role.id,
            module_id: moduleId,
            type: "module"
          });
        }
      }
      
      // Add document assignments
      if (Array.isArray(role.documents)) {
        for (const documentId of role.documents) {
          roleAssignments.push({
            role_id: role.id,
            document_id: documentId,
            type: "document"
          });
        }
      }
      
      if (roleAssignments.length > 0) {
        console.log(`  Migrating ${roleAssignments.length} assignments for role: ${role.title}`);
        
        // Insert using upsert to avoid duplicates
        const { error: insertError } = await supabase
          .from("role_assignments")
          .upsert(roleAssignments, { 
            onConflict: 'role_id,module_id,document_id,type',
            ignoreDuplicates: true 
          });
          
        if (insertError) {
          console.error(`  Error migrating role ${role.title}:`, insertError);
        }
      }
    }
    
    console.log("✅ Role data migration complete!\n");
  } else {
    console.log("✅ No embedded role data found. Role assignments table is ready!\n");
  }

  // STEP 2: Backfill user assignments
  console.log("👥 Step 2: Backfilling user assignments...");
  
  // Get all unique role IDs from role_assignments
  const { data: roleAssignmentRoles, error: roleAssignmentError } = await supabase
    .from("role_assignments")
    .select("role_id")
    .not("role_id", "is", null);
    
  if (roleAssignmentError) {
    console.error("Failed to fetch role assignments:", roleAssignmentError);
    return;
  }

  const uniqueRoleIds = Array.from(new Set((roleAssignmentRoles || []).map(r => r.role_id)));
  console.log(`Found ${uniqueRoleIds.length} roles with assignments to process`);

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const role_id of uniqueRoleIds) {
    // Get role name for logging
    const { data: roleData } = await supabase
      .from("roles")
      .select("title")
      .eq("id", role_id)
      .single();
    
    const roleName = roleData?.title || `Role ${role_id}`;
    
    // Get modules/documents for this role
    const { data: assignments } = await supabase
      .from("role_assignments")
      .select("module_id, document_id, type")
      .eq("role_id", role_id);
      
    if (!assignments || assignments.length === 0) {
      console.log(`  ⚠️  ${roleName}: No assignments found`);
      continue;
    }

    // Get all users with this role
    const { data: usersWithRole } = await supabase
      .from("users")
      .select("auth_id, first_name, last_name")
      .eq("role_id", role_id);
      
    if (!usersWithRole || usersWithRole.length === 0) {
      console.log(`  ⚠️  ${roleName}: No users found with this role`);
      continue;
    }

    console.log(`  Processing ${roleName}: ${assignments.length} assignments × ${usersWithRole.length} users = ${assignments.length * usersWithRole.length} potential user assignments`);

    // Build assignment records
    const newAssignments = [];
    for (const user of usersWithRole) {
      for (const assignment of assignments) {
        if (assignment.type === "module" && assignment.module_id) {
          newAssignments.push({ 
            auth_id: user.auth_id, 
            item_id: assignment.module_id, 
            item_type: "module" 
          });
        }
        if (assignment.type === "document" && assignment.document_id) {
          newAssignments.push({ 
            auth_id: user.auth_id, 
            item_id: assignment.document_id, 
            item_type: "document" 
          });
        }
      }
    }

    // Get existing assignments to avoid duplicates
    const { data: existingAssignments } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type")
      .in("auth_id", usersWithRole.map(u => u.auth_id));

    const existingSet = new Set(
      (existingAssignments || []).map((a) => `${a.auth_id}|${a.item_id}|${a.item_type}`)
    );

    // Filter out duplicates
    const filtered = newAssignments.filter((a) => {
      const key = `${a.auth_id}|${a.item_id}|${a.item_type}`;
      return !existingSet.has(key);
    });

    if (filtered.length > 0) {
      const { error: insertError } = await supabase
        .from("user_assignments")
        .insert(filtered);
        
      if (insertError) {
        console.error(`    ❌ Insert error for ${roleName}:`, insertError);
      } else {
        console.log(`    ✅ Inserted ${filtered.length} new assignments`);
        totalInserted += filtered.length;
      }
    } else {
      console.log(`    ℹ️  All assignments already exist`);
    }
    
    totalSkipped += (newAssignments.length - filtered.length);
  }

  console.log(`\n🎉 Backfill complete!`);
  console.log(`   New assignments inserted: ${totalInserted}`);
  console.log(`   Duplicate assignments skipped: ${totalSkipped}`);
  console.log(`   Total assignments processed: ${totalInserted + totalSkipped}`);

  // STEP 3: Final verification
  console.log(`\n🔍 Final verification...`);
  
  const { count: finalUserAssignments } = await supabase
    .from("user_assignments")
    .select("*", { count: 'exact', head: true });
    
  const { count: finalRoleAssignments } = await supabase
    .from("role_assignments")
    .select("*", { count: 'exact', head: true });
    
  const { count: totalUsers } = await supabase
    .from("users")
    .select("*", { count: 'exact', head: true })
    .not("role_id", "is", null);

  console.log(`   Role assignments: ${finalRoleAssignments}`);
  console.log(`   User assignments: ${finalUserAssignments}`);
  console.log(`   Users with roles: ${totalUsers}`);
}

fullBackfillProcess().catch(console.error);
