import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { user_id, new_role_id } = await req.json();

    if (!user_id || !new_role_id) {
      return NextResponse.json({ 
        error: "Missing user_id or new_role_id" 
      }, { status: 400 });
    }

    console.log(`🔄 Processing role change for user ${user_id} → role ${new_role_id}`);

    // 1. Get user's current info including old role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, auth_id, role_id, first_name, last_name")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const old_role_id = user.role_id;
    console.log(`User ${user.first_name} ${user.last_name}: ${old_role_id} → ${new_role_id}`);

    // 2. Remove ALL existing assignments for this user
    const { count: removedCount, error: removeError } = await supabase
      .from("user_assignments")
      .delete({ count: "exact" })
      .eq("auth_id", user.auth_id);

    if (removeError) {
      console.error("Error removing old assignments:", removeError);
      return NextResponse.json({ 
        error: "Failed to remove old assignments", 
        details: removeError 
      }, { status: 500 });
    }

    console.log(`✅ Removed ${removedCount || 0} old assignments`);

    // 3. Update user's role in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ role_id: new_role_id })
      .eq("id", user_id);

    if (updateError) {
      console.error("Error updating user role:", updateError);
      return NextResponse.json({ 
        error: "Failed to update user role", 
        details: updateError 
      }, { status: 500 });
    }

    // 4. Get new role assignments
    const { data: newRoleAssignments, error: roleError } = await supabase
      .from("role_assignments")
      .select("module_id, document_id, type")
      .eq("role_id", new_role_id);

    if (roleError) {
      console.error("Error fetching new role assignments:", roleError);
      return NextResponse.json({ 
        error: "Failed to fetch new role assignments", 
        details: roleError 
      }, { status: 500 });
    }

    // 5. Deduplicate new assignments
    const assignmentMap = new Map();
    (newRoleAssignments || []).forEach(a => {
      const itemId = a.module_id || a.document_id;
      const key = `${new_role_id}-${a.type}-${itemId}`;
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, a);
      }
    });
    const uniqueAssignments = Array.from(assignmentMap.values());

    // 6. Create new assignments for this user
    const newAssignments = uniqueAssignments.map(a => ({
      auth_id: user.auth_id,
      item_id: a.document_id || a.module_id,
      item_type: a.type,
      assigned_at: new Date().toISOString()
    }));

    let addedCount = 0;
    if (newAssignments.length > 0) {
      const { count, error: insertError } = await supabase
        .from("user_assignments")
        .insert(newAssignments, { count: "exact" });

      if (insertError) {
        console.error("Error inserting new assignments:", insertError);
        return NextResponse.json({ 
          error: "Failed to insert new assignments", 
          details: insertError 
        }, { status: 500 });
      }

      addedCount = count || 0;
    }

    console.log(`✅ Added ${addedCount} new assignments`);

    // 7. Log the role change for audit
    const { error: logError } = await supabase
      .from("user_role_change_log")
      .insert({
        user_id,
        old_role_id,
        new_role_id,
        assignments_removed: removedCount || 0,
        assignments_added: addedCount,
        changed_at: new Date().toISOString()
      });

    if (logError) {
      console.warn("Failed to log role change:", logError);
    }

    return NextResponse.json({
      message: "Role change completed successfully",
      user_id,
      old_role_id,
      new_role_id,
      assignments_removed: removedCount || 0,
      assignments_added: addedCount,
      user_name: `${user.first_name} ${user.last_name}`
    });

  } catch (err) {
    const error = err as Error;
    console.error("Role change error:", error);
    return NextResponse.json({ 
      error: "Failed to process role change", 
      details: error.message 
    }, { status: 500 });
  }
}
