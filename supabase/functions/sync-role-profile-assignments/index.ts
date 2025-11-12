import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("76056fcd98736413b0e834781dfcea35a6edfb883f1bca92f4525932120c9b5f")!,
  Deno.env.get("012aae66e5c3e8990e6e84d0a858401c578ebb7a4f57eec8ee4df05b7c998b30")!,
);

async function syncRoleProfileAssignments(role_id: string): Promise<number> {
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
  type Assignment = { auth_id: string; module_id?: string; document_id?: string; type: "module" | "document" };
  const newAssignments: Assignment[] = [];
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
        due_at: new Date().toISOString(), // Due immediately when assigned
      };
    });
    const { error: insertError } = await supabase.from("user_assignments").insert(toInsert);
    if (insertError) {
      throw new Error("Insert failed: " + insertError.message);
    }
  }

  return filtered.length;
}

serve(async (req) => {
  try {
    const { role_id } = await req.json();
    if (!role_id) {
      return new Response("Missing role_id", { status: 400 });
    }
    const inserted = await syncRoleProfileAssignments(role_id);
    return new Response(`Synced. Inserted: ${inserted}`, { status: 200 });
  } catch (err) {
    return new Response(`Error: ${err}`, { status: 500 });
  }
});