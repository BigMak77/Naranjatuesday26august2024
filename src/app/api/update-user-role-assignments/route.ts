import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { protectAPIRoute } from "@/lib/api-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Protect this route - only Super Admin and Admin can change role assignments
  const authResult = await protectAPIRoute(req, ["Super Admin", "Admin"]);
  if (authResult instanceof NextResponse) {
    return authResult; // Return error response if not authorized
  }

  try {
    const { user_id, old_role_id, new_role_id } = await req.json();

    if (!user_id || !new_role_id) {
      return NextResponse.json({ error: "Missing user_id or new_role_id" }, { status: 400 });
    }

    console.log(`🔄 Processing role change for user ${user_id}: ${old_role_id} → ${new_role_id}`);

    // 1. Get the user's auth_id
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("auth_id")
      .eq("id", user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Update user's role_id FIRST
    const { error: updateRoleError } = await supabase
      .from("users")
      .update({ role_id: new_role_id })
      .eq("id", user_id);

    if (updateRoleError) {
      console.error("Failed to update user role:", updateRoleError);
      return NextResponse.json({
        error: "Failed to update user role",
        details: updateRoleError
      }, { status: 500 });
    }

    // 3. Get new role assignments to determine what to keep
    const { data: newRoleAssignments } = await supabase
      .from("role_assignments")
      .select("module_id, document_id, type")
      .eq("role_id", new_role_id);

    // Create set of new role's item IDs
    const newRoleItemSet = new Set(
      (newRoleAssignments || []).map(a => {
        const itemId = a.module_id || a.document_id;
        return `${itemId}|${a.type}`;
      })
    );

    // 4. Remove ONLY incomplete assignments that are NOT in the new role
    // This preserves:
    // - ALL completed assignments (regardless of role)
    // - Incomplete assignments that are also in the new role
    const { data: currentAssignments } = await supabase
      .from("user_assignments")
      .select("id, item_id, item_type, completed_at")
      .eq("auth_id", user.auth_id)
      .is("completed_at", null); // Only get incomplete assignments

    let removedCount = 0;
    if (currentAssignments && currentAssignments.length > 0) {
      const assignmentsToDelete = currentAssignments.filter(a => {
        const key = `${a.item_id}|${a.item_type}`;
        return !newRoleItemSet.has(key); // Delete if NOT in new role
      });

      if (assignmentsToDelete.length > 0) {
        const idsToDelete = assignmentsToDelete.map(a => a.id);
        const { error: deleteError, count } = await supabase
          .from("user_assignments")
          .delete({ count: 'exact' })
          .in("id", idsToDelete);

        if (deleteError) {
          console.error("Failed to remove old incomplete assignments:", deleteError);
        } else {
          removedCount = count || 0;
        }
      }
    }

    console.log(`✅ Removed ${removedCount} incomplete assignments not in new role`);

    // 5. Add new role assignments (sync will skip duplicates)
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sync-training-from-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: new_role_id })
    });

    const syncResult = await syncResponse.json();

    if (!syncResponse.ok) {
      return NextResponse.json({
        error: "Failed to sync new role assignments",
        details: syncResult
      }, { status: 500 });
    }

    // 6. Log the role change
    const { error: logError } = await supabase
      .from("user_role_change_log")
      .insert({
        user_id,
        old_role_id,
        new_role_id,
        assignments_removed: removedCount,
        assignments_added: syncResult.inserted || 0,
        changed_at: new Date().toISOString()
      });

    if (logError) {
      console.warn("Failed to log role change:", logError);
    }

    return NextResponse.json({
      message: "Role change processed successfully",
      removed_assignments: removedCount,
      added_assignments: syncResult.inserted || 0,
      user_id,
      old_role_id,
      new_role_id
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
