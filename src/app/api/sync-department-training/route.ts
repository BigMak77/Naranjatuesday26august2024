import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { department_id } = await req.json();

    if (!department_id) {
      return NextResponse.json({ error: "Missing department_id" }, { status: 400 });
    }

    // 1. Get all assignments for this department from department_assignments
    const { data: deptAssignments } = await supabase
      .from("department_assignments")
      .select("item_id, type")
      .eq("department_id", department_id);

    if (!deptAssignments || deptAssignments.length === 0) {
      return NextResponse.json({
        message: "No department assignments found",
        inserted: 0
      });
    }

    // 2. Get all roles in this department
    const { data: rolesInDept } = await supabase
      .from("roles")
      .select("id")
      .eq("department_id", department_id);

    if (!rolesInDept || rolesInDept.length === 0) {
      return NextResponse.json({
        message: "No roles found in department",
        inserted: 0
      });
    }

    const roleIds = rolesInDept.map(r => r.id);

    // 3. Get all users in these roles (only those with valid auth_id)
    const { data: usersInDept } = await supabase
      .from("users")
      .select("auth_id")
      .in("role_id", roleIds)
      .not("auth_id", "is", null);

    if (!usersInDept || usersInDept.length === 0) {
      return NextResponse.json({
        message: "No users with valid auth_id found in department",
        inserted: 0
      });
    }

    const authIds = usersInDept.map(u => u.auth_id).filter(id => id != null);

    // 4. Create user assignments for all department assignments
    // Get the full department assignment records with their IDs
    const { data: fullDeptAssignments } = await supabase
      .from("department_assignments")
      .select("id, item_id, type")
      .eq("department_id", department_id);

    if (!fullDeptAssignments || fullDeptAssignments.length === 0) {
      return NextResponse.json({
        message: "No department assignments found after insert",
        inserted: 0
      });
    }

    const userAssignments = [];
    for (const user of usersInDept) {
      for (const assignment of fullDeptAssignments) {
        userAssignments.push({
          auth_id: user.auth_id,
          item_id: assignment.item_id,
          item_type: assignment.type,
          due_at: new Date().toISOString()
        });
      }
    }

    // 5. Get existing assignments to avoid duplicates
    const { data: existingAssignments } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type")
      .in("auth_id", authIds);

    const existingSet = new Set(
      (existingAssignments || []).map((a) =>
        [a.auth_id, a.item_id, a.item_type].join("|")
      )
    );

    // 6. Filter out duplicates
    const filtered = userAssignments.filter((a) => {
      const key = [a.auth_id, a.item_id, a.item_type].join("|");
      return !existingSet.has(key);
    });

    console.log(`Syncing department ${department_id}: ${filtered.length} new assignments for ${authIds.length} users`);

    // 7. Insert new user assignments
    if (filtered.length > 0) {
      console.log("About to insert records:", JSON.stringify(filtered.slice(0, 2), null, 2));

      const { error: insertError } = await supabase
        .from("user_assignments")
        .insert(filtered);

      if (insertError) {
        console.error("Insert error:", insertError);
        console.error("Insert error code:", insertError.code);
        console.error("Insert error message:", insertError.message);
        console.error("Insert error details:", insertError.details);
        console.error("Sample record that failed:", JSON.stringify(filtered[0], null, 2));

        return NextResponse.json({
          error: "Insert failed",
          details: insertError,
          sampleRecord: filtered[0]
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      inserted: filtered.length,
      total_assignments: deptAssignments.length,
      users_affected: authIds.length
    });
  } catch (err) {
    console.error("Sync department training error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
