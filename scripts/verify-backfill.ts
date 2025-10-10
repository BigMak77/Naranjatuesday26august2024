import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function verifyBackfill() {
  console.log("🔍 Verifying backfill results...\n");

  try {
    // Get totals
    const { count: users } = await supabase
      .from("users")
      .select("*", { count: 'exact', head: true })
      .not("role_id", "is", null);

    const { count: roleAssignments } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });

    const { count: userAssignments } = await supabase
      .from("user_assignments")
      .select("*", { count: 'exact', head: true });

    console.log("📊 Current Status:");
    console.log(`   Users with roles: ${users}`);
    console.log(`   Role assignments: ${roleAssignments}`);
    console.log(`   User assignments: ${userAssignments}\n`);

    // Check for roles without assignments
    const { data: rolesWithoutAssignments } = await supabase
      .rpc('get_roles_without_assignments');

    if (rolesWithoutAssignments && rolesWithoutAssignments.length > 0) {
      console.log(`⚠️  Roles without assignments: ${rolesWithoutAssignments.length}`);
    }

    // Calculate expected vs actual user assignments
    const { data: roleStats } = await supabase
      .from("roles")
      .select(`
        id,
        title,
        role_assignments(count),
        users(count)
      `);

    let expectedTotal = 0;
    console.log("🔢 Expected vs Actual breakdown:");
    
    for (const role of roleStats || []) {
      const assignmentCount = Array.isArray(role.role_assignments) ? role.role_assignments.length : 0;
      const userCount = Array.isArray(role.users) ? role.users.length : 0;
      const expected = assignmentCount * userCount;
      expectedTotal += expected;
      
      if (expected > 0) {
        console.log(`   ${role.title}: ${expected} expected assignments (${assignmentCount} × ${userCount})`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Expected total user assignments: ${expectedTotal}`);
    console.log(`   Actual user assignments: ${userAssignments}`);
    
    if (userAssignments === expectedTotal) {
      console.log(`   ✅ Perfect match! All users have correct assignments.`);
    } else {
      console.log(`   ⚠️  Difference: ${expectedTotal - (userAssignments || 0)} assignments`);
    }

  } catch (error) {
    console.error("Error during verification:", error);
  }
}

verifyBackfill().catch(console.error);
