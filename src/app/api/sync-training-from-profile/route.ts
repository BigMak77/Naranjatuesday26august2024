import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // needs insert access to user_assignments (updated)
);

export async function POST(req: NextRequest) {
  try {
    const { role_id, user_id, remove_old_assignments = false } = await req.json();

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
      .select("auth_id, id")
      .eq("role_id", role_id);
    if (userFetchError) {
      console.error("User fetch error:", userFetchError);
      return NextResponse.json({ error: "Failed to fetch users with role_id", details: userFetchError }, { status: 500 });
    }
    if (!usersWithRole || usersWithRole.length === 0) {
      return NextResponse.json({ error: "No users found with this role_id" }, { status: 404 });
    }
    const auth_ids = usersWithRole.map(u => u.auth_id);
    const user_ids = usersWithRole.map(u => u.id);

    // 3. Build assignment records for user_assignments table
    const newAssignments = [];
    for (let i = 0; i < usersWithRole.length; i++) {
      const user = usersWithRole[i];
      for (const a of assignments) {
        const item_id = a.document_id || a.module_id;
        newAssignments.push({
          auth_id: user.auth_id,
          item_id: item_id,
          item_type: a.type,
          assigned_at: new Date().toISOString()
        });
      }
    }

    // 4. Get all existing assignments for these users
    const { data: existingAssignments } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type")
      .in("auth_id", auth_ids);

    const existingSet = new Set(
      (existingAssignments || []).map((a) => {
        return [a.auth_id, a.item_id, a.item_type].join("|");
      })
    );

    // 5. Filter out duplicates based on (auth_id, item_id, item_type) combination
    const filtered = newAssignments.filter((a) => {
      const key = [a.auth_id, a.item_id, a.item_type].join("|");
      return !existingSet.has(key);
    });

    console.log("Filtered assignments to insert:", filtered);
    console.log(`About to insert ${filtered.length} assignments`);

    // 6. Insert new assignments
    if (filtered.length > 0) {
      const { error: insertError } = await supabase
        .from("user_assignments")
        .insert(filtered);
      
      if (insertError) {
        console.error("Insert error:", insertError);
        return NextResponse.json({ error: "Insert failed", details: insertError }, { status: 500 });
      }
      
      console.log(`Successfully inserted ${filtered.length} assignments`);
    } else {
      console.log("No assignments to insert (all filtered out)");
    }

    return NextResponse.json({ 
      inserted: filtered.length,
      total_assignments: assignments.length,
      users_affected: usersWithRole.length 
    });
  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
