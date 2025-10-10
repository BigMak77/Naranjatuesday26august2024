import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // needs insert access to user_assignments (updated)
);

export async function POST(req: NextRequest) {
  try {
    const { role_id } = await req.json();

    if (!role_id) {
      return NextResponse.json({ error: "Missing role_id" }, { status: 400 });
    }

    // 1. Get DISTINCT modules, documents, behaviours linked to this role from role_assignments
    // This prevents processing duplicates from the source table
    const { data: rawAssignments } = await supabase
      .from("role_assignments")
      .select("module_id, document_id, type")
      .eq("role_id", role_id);

    if (!rawAssignments) {
      return NextResponse.json({ error: "Failed to fetch role assignments" }, { status: 500 });
    }

    // Deduplicate assignments based on role_id + item_id + type combination
    // This prevents processing the same role-document or role-module assignment twice
    const assignmentMap = new Map();
    rawAssignments.forEach(a => {
      const itemId = a.module_id || a.document_id;
      const key = `${role_id}-${a.type}-${itemId}`;
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, a);
      }
    });
    const assignments = Array.from(assignmentMap.values());

    // 2. Get all users with this role_id
    const { data: usersWithRole, error: userFetchError } = await supabase
      .from("users")
      .select("auth_id")
      .eq("role_id", role_id);
    if (userFetchError) {
      console.error("User fetch error:", userFetchError);
      return NextResponse.json({ error: "Failed to fetch users with role_id", details: userFetchError }, { status: 500 });
    }
    if (!usersWithRole || usersWithRole.length === 0) {
      return NextResponse.json({ error: "No users found with this role_id" }, { status: 404 });
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

    console.log("Filtered assignments to insert:", filtered);

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
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: "Insert failed", details: insertError }, { status: 500 });
      }
    }

    return NextResponse.json({ inserted: filtered.length });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
