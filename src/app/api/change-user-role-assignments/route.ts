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

    // 2. Note: Completed training is preserved in user_assignments table
    // We no longer delete completed assignments when changing roles
    // They remain as historical records with their completion dates
    console.log(`ℹ️  Completed training will be preserved in user_assignments for historical reference`);

    // 3. Update user's role in database FIRST
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

    // 5. Deduplicate new role assignments
    const assignmentMap = new Map();
    (newRoleAssignments || []).forEach(a => {
      const itemId = a.module_id || a.document_id;
      const key = `${new_role_id}-${a.type}-${itemId}`;
      if (!assignmentMap.has(key)) {
        assignmentMap.set(key, a);
      }
    });
    const uniqueAssignments = Array.from(assignmentMap.values());

    // 6. Create set of new role's item IDs for quick lookup
    const newRoleItemSet = new Set(
      uniqueAssignments.map(a => {
        const itemId = a.document_id || a.module_id;
        return `${itemId}|${a.type}`;
      })
    );

    // 7. Remove ONLY incomplete assignments that are NOT in the new role
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
          .delete({ count: "exact" })
          .in("id", idsToDelete);

        if (deleteError) {
          console.error("Error removing old incomplete assignments:", deleteError);
        } else {
          removedCount = count || 0;
        }
      }
    }

    console.log(`✅ Removed ${removedCount} incomplete assignments not in new role (preserved completed training and overlapping incomplete)`);

    // 8. Get ALL existing assignments (both completed and incomplete that we kept)
    const { data: allExistingAssignments, error: existingError } = await supabase
      .from("user_assignments")
      .select("item_id, item_type, completed_at")
      .eq("auth_id", user.auth_id);

    if (existingError) {
      console.warn("Failed to fetch existing assignments:", existingError);
    }

    // Create a map of all existing assignments
    const existingMap = new Map();
    (allExistingAssignments || []).forEach(assignment => {
      const key = `${assignment.item_id}|${assignment.item_type}`;
      existingMap.set(key, assignment);
    });

    // Note: Historical completions are preserved in user_assignments
    // We don't need a separate table - completed assignments remain in user_assignments
    // with their completion dates intact
    console.log(`ℹ️  Checking for historical completions in user_assignments table`);

    // 9. Create new assignments ONLY for items that don't already exist
    const newAssignments = uniqueAssignments
      .map(a => {
        const itemId = a.document_id || a.module_id;
        const completionKey = `${itemId}|${a.type}`;

        // Skip if this assignment already exists (either completed or incomplete)
        // Historical completions are already in user_assignments table
        if (existingMap.has(completionKey)) {
          return null;
        }

        return {
          auth_id: user.auth_id,
          item_id: itemId,
          item_type: a.type,
          assigned_at: new Date().toISOString(),
          completed_at: null // New assignments start incomplete
        };
      })
      .filter(a => a !== null); // Remove nulls (duplicates)

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
      completions_restored: 0, // Completions are preserved in place, not restored
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
