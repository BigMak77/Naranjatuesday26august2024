import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function syncRoleProfileAssignments(role_id: string): Promise<number> {
  // 1. Get modules, documents, behaviours linked to this role from role_assignments
  const { data: assignments } = await supabase
    .from("role_assignments")
    .select("module_id, document_id, type")
    .eq("role_id", role_id);

  if (!assignments) {
    throw new Error("Failed to fetch role assignments");
  }

  // 2. Get all users with this role_id
  const { data: usersWithRole, error: userFetchError } = await supabase
    .from("users")
    .select("auth_id")
    .eq("role_id", role_id);
  if (userFetchError) {
    throw new Error("Failed to fetch users with role_id: " + userFetchError.message);
  }
  if (!usersWithRole || usersWithRole.length === 0) {
    return 0;
  }
  const auth_ids = usersWithRole.map(u => u.auth_id);

  // 3. Build assignment records
  const newAssignments = [];
  for (const auth_id of auth_ids) {
    for (const a of assignments) {
      if (a.type === "module" && a.module_id) {
        newAssignments.push({ auth_id, module_id: a.module_id, type: "module" });
      }
      if (a.type === "document" && a.document_id) {
        newAssignments.push({ auth_id, document_id: a.document_id, type: "document" });
      }
      // If you support behaviours, add here
    }
  }

  // 4. Get all existing assignments for these users
  const { data: existingAssignments } = await supabase
    .from("user_assignments")
    .select("auth_id, item_id, item_type");

  const existingSet = new Set(
    (existingAssignments || []).map((a) => [a.auth_id, a.item_id, a.item_type].join("|"))
  );

  // 5. Filter out duplicates
  const filtered = newAssignments.filter((a) => {
    let item_id = a.module_id || a.document_id;
    let item_type = a.type;
    const key = [a.auth_id, item_id, item_type].join("|");
    return !existingSet.has(key);
  });

  // 6. Insert new assignments into user_assignments
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
      throw new Error("Insert failed: " + insertError.message);
    }
  }

  return filtered.length;
}
