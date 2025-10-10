require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function fullMigrationAndBackfill() {
  console.log("🚀 Starting complete migration and backfill process...\n");
  
  try {
    // STEP 1: Check current state
    console.log("📊 Step 1: Checking current state...");
    
    const { count: roleCount } = await supabase
      .from("roles")
      .select("*", { count: 'exact', head: true });
    
    const { count: roleAssignmentCount } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });
    
    const { count: userAssignmentCount } = await supabase
      .from("user_assignments")
      .select("*", { count: 'exact', head: true });
    
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: true })
      .not("role_id", "is", null);
    
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Role assignments: ${roleAssignmentCount}`);
    console.log(`   User assignments: ${userAssignmentCount}`);
    console.log(`   Users with roles: ${userCount}`);
    
    // STEP 2: Check for embedded role data
    console.log("\n🔍 Step 2: Checking for embedded role data...");
    
    const { data: allRoles } = await supabase
      .from("roles")
      .select("*");
    
    let rolesNeedingMigration = [];
    let totalEmbeddedAssignments = 0;
    
    for (const role of allRoles || []) {
      let hasEmbeddedData = false;
      let embeddedCount = 0;
      
      // Check modules field
      if (role.modules) {
        if (Array.isArray(role.modules) && role.modules.length > 0) {
          hasEmbeddedData = true;
          embeddedCount += role.modules.length;
        } else if (typeof role.modules === 'string' && role.modules.trim() !== '') {
          // Handle case where modules might be stored as JSON string
          try {
            const parsed = JSON.parse(role.modules);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hasEmbeddedData = true;
              embeddedCount += parsed.length;
              role.modules = parsed; // Update for processing
            }
          } catch (e) {
            // Not JSON, treat as single module ID
            if (role.modules.trim() !== '') {
              hasEmbeddedData = true;
              embeddedCount += 1;
            }
          }
        }
      }
      
      // Check documents field
      if (role.documents) {
        if (Array.isArray(role.documents) && role.documents.length > 0) {
          hasEmbeddedData = true;
          embeddedCount += role.documents.length;
        } else if (typeof role.documents === 'string' && role.documents.trim() !== '') {
          try {
            const parsed = JSON.parse(role.documents);
            if (Array.isArray(parsed) && parsed.length > 0) {
              hasEmbeddedData = true;
              embeddedCount += parsed.length;
              role.documents = parsed; // Update for processing
            }
          } catch (e) {
            if (role.documents.trim() !== '') {
              hasEmbeddedData = true;
              embeddedCount += 1;
            }
          }
        }
      }
      
      if (hasEmbeddedData) {
        rolesNeedingMigration.push(role);
        totalEmbeddedAssignments += embeddedCount;
        console.log(`   ${role.title}: ${embeddedCount} embedded assignments`);
      }
    }
    
    console.log(`   Found ${rolesNeedingMigration.length} roles with embedded data`);
    console.log(`   Total embedded assignments: ${totalEmbeddedAssignments}`);
    
    // STEP 3: Migrate embedded role data to role_assignments table
    if (rolesNeedingMigration.length > 0) {
      console.log("\n📦 Step 3: Migrating embedded role data...");
      
      for (const role of rolesNeedingMigration) {
        const roleAssignments = [];
        
        // Process modules
        if (role.modules) {
          const moduleIds = Array.isArray(role.modules) ? role.modules : [role.modules];
          for (const moduleId of moduleIds) {
            if (moduleId && moduleId.trim()) {
              roleAssignments.push({
                role_id: role.id,
                module_id: moduleId.trim(),
                type: "module"
              });
            }
          }
        }
        
        // Process documents
        if (role.documents) {
          const documentIds = Array.isArray(role.documents) ? role.documents : [role.documents];
          for (const documentId of documentIds) {
            if (documentId && documentId.trim()) {
              roleAssignments.push({
                role_id: role.id,
                document_id: documentId.trim(),
                type: "document"
              });
            }
          }
        }
        
        if (roleAssignments.length > 0) {
          console.log(`   Migrating ${roleAssignments.length} assignments for: ${role.title}`);
          
          // Use upsert to avoid duplicates
          const { error: insertError } = await supabase
            .from("role_assignments")
            .upsert(roleAssignments, { 
              onConflict: 'role_id,module_id,document_id,type',
              ignoreDuplicates: true 
            });
          
          if (insertError) {
            console.error(`   ❌ Error migrating ${role.title}:`, insertError.message);
          } else {
            console.log(`   ✅ Successfully migrated assignments for: ${role.title}`);
          }
        }
      }
      
      console.log("✅ Role data migration complete!");
    } else {
      console.log("✅ No embedded role data to migrate");
    }
    
    // STEP 4: Backfill user assignments
    console.log("\n👥 Step 4: Backfilling user assignments...");
    
    // Get all unique role IDs that have assignments
    const { data: roleAssignments } = await supabase
      .from("role_assignments")
      .select("role_id")
      .not("role_id", "is", null);
    
    const uniqueRoleIds = [...new Set((roleAssignments || []).map(r => r.role_id))];
    console.log(`   Processing ${uniqueRoleIds.length} roles with assignments...`);
    
    let totalNewAssignments = 0;
    let totalExistingAssignments = 0;
    
    for (const roleId of uniqueRoleIds) {
      // Get role details
      const { data: roleData } = await supabase
        .from("roles")
        .select("title")
        .eq("id", roleId)
        .single();
      
      const roleName = roleData?.title || `Role ${roleId}`;
      
      // Get assignments for this role
      const { data: assignments } = await supabase
        .from("role_assignments")
        .select("module_id, document_id, type")
        .eq("role_id", roleId);
      
      // Get users with this role
      const { data: users } = await supabase
        .from("users")
        .select("auth_id")
        .eq("role_id", roleId);
      
      if (!assignments?.length || !users?.length) {
        console.log(`   ⚠️  Skipping ${roleName}: ${assignments?.length || 0} assignments, ${users?.length || 0} users`);
        continue;
      }
      
      console.log(`   Processing ${roleName}: ${assignments.length} assignments × ${users.length} users`);
      
      // Create user assignments
      const userAssignments = [];
      for (const user of users) {
        for (const assignment of assignments) {
          if (assignment.type === "module" && assignment.module_id) {
            userAssignments.push({
              auth_id: user.auth_id,
              item_id: assignment.module_id,
              item_type: "module"
            });
          }
          if (assignment.type === "document" && assignment.document_id) {
            userAssignments.push({
              auth_id: user.auth_id,
              item_id: assignment.document_id,
              item_type: "document"
            });
          }
        }
      }
      
      // Filter out existing assignments
      const { data: existing } = await supabase
        .from("user_assignments")
        .select("auth_id, item_id, item_type")
        .in("auth_id", users.map(u => u.auth_id));
      
      const existingSet = new Set(
        (existing || []).map(a => `${a.auth_id}|${a.item_id}|${a.item_type}`)
      );
      
      const newAssignments = userAssignments.filter(a => 
        !existingSet.has(`${a.auth_id}|${a.item_id}|${a.item_type}`)
      );
      
      totalExistingAssignments += (userAssignments.length - newAssignments.length);
      
      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("user_assignments")
          .insert(newAssignments);
        
        if (insertError) {
          console.error(`   ❌ Error for ${roleName}:`, insertError.message);
        } else {
          console.log(`   ✅ Added ${newAssignments.length} new assignments`);
          totalNewAssignments += newAssignments.length;
        }
      } else {
        console.log(`   ℹ️  All ${userAssignments.length} assignments already exist`);
      }
    }
    
    // STEP 5: Final summary
    console.log(`\n🎉 Migration and backfill complete!`);
    console.log(`   New user assignments created: ${totalNewAssignments}`);
    console.log(`   Existing assignments (skipped): ${totalExistingAssignments}`);
    
    // Final verification
    const { count: finalUserAssignments } = await supabase
      .from("user_assignments")
      .select("*", { count: 'exact', head: true });
    
    const { count: finalRoleAssignments } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });
    
    console.log(`\n📊 Final totals:`);
    console.log(`   Role assignments: ${finalRoleAssignments}`);
    console.log(`   User assignments: ${finalUserAssignments}`);
    console.log(`   Users with roles: ${userCount}`);
    
  } catch (error) {
    console.error("❌ Error during migration:", error);
  }
}

fullMigrationAndBackfill();
