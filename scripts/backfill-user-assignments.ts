import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function backfillUserAssignments() {
  // 1. Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from("role_assignments")
    .select("role_id")
    .not("role_id", "is", null);
  if (rolesError) {
    console.error("Failed to fetch roles:", rolesError);
    return;
  }
  const uniqueRoleIds = Array.from(new Set((roles || []).map(r => r.role_id)));

  let totalInserted = 0;
  for (const role_id of uniqueRoleIds) {
    // 2. Get modules/documents for this role
    const { data: assignments } = await supabase
      .from("role_assignments")
      .select("module_id, document_id, type")
      .eq("role_id", role_id);
    if (!assignments || assignments.length === 0) continue;

    // 3. Get all users with this role
    const { data: usersWithRole } = await supabase
      .from("users")
      .select("auth_id")
      .eq("role_id", role_id);
    if (!usersWithRole || usersWithRole.length === 0) continue;
    const auth_ids = usersWithRole.map(u => u.auth_id);

    // 4. Build assignment records
    const newAssignments = [];
    for (const auth_id of auth_ids) {
      for (const a of assignments) {
        if (a.type === "module" && a.module_id) {
          newAssignments.push({ auth_id, module_id: a.module_id, type: "module" });
        }
        if (a.type === "document" && a.document_id) {
          newAssignments.push({ auth_id, document_id: a.document_id, type: "document" });
        }
      }
    }

    // 5. Get all existing assignments for these users
    const { data: existingAssignments } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type");
    const existingSet = new Set(
      (existingAssignments || []).map((a) => [a.auth_id, a.item_id, a.item_type].join("|"))
    );

    // 6. Filter out duplicates
    const filtered = newAssignments.filter((a) => {
      let item_id = a.module_id || a.document_id;
      let item_type = a.type;
      const key = [a.auth_id, item_id, item_type].join("|");
      return !existingSet.has(key);
    });

    // 7. Insert new assignments
    if (filtered.length > 0) {
      const toInsert = filtered.map((a) => {
        let item_id = a.module_id || a.document_id;
        return {
          auth_id: a.auth_id,
          item_id,
          item_type: a.type,
        };
      });
      const { error: insertError } = await supabase.from("user_assignments").insert(toInsert);
      if (insertError) {
        console.error(`Insert error for role_id ${role_id}:`, insertError);
      } else {
        console.log(`Inserted ${toInsert.length} assignments for role_id ${role_id}`);
        totalInserted += toInsert.length;
      }
    }
  }
  console.log(`Backfill complete. Total assignments inserted: ${totalInserted}`);
}

backfillUserAssignments();
