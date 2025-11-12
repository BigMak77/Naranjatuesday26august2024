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

    // 2. Preserve completed training before removing assignments
    const { data: completedAssignments, error: completedError } = await supabase
      .from("user_assignments")
      .select("item_id, item_type, completed_at")
      .eq("auth_id", user.auth_id)
      .not("completed_at", "is", null);

    if (completedError) {
      console.error("Error fetching completed assignments:", completedError);
      return NextResponse.json({ 
        error: "Failed to fetch completed assignments", 
        details: completedError 
      }, { status: 500 });
    }

    // Save completions to permanent table
    if (completedAssignments && completedAssignments.length > 0) {
      const completionRecords = completedAssignments.map(assignment => ({
        auth_id: user.auth_id,
        item_id: assignment.item_id,
        item_type: assignment.item_type,
        completed_at: assignment.completed_at,
        completed_by_role_id: old_role_id
      }));

      const { error: saveCompletionsError } = await supabase
        .from("user_training_completions")
        .upsert(completionRecords, { 
          onConflict: 'auth_id,item_id,item_type',
          ignoreDuplicates: true 
        });

      if (saveCompletionsError) {
        console.warn("Failed to save training completions:", saveCompletionsError);
        // Don't fail the entire operation, but log it
      } else {
        console.log(`✅ Preserved ${completedAssignments.length} training completions`);
      }
    }

    // 3. Remove ALL existing assignments for this user
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

    // 6. Get existing completions for this user
    const { data: existingCompletions, error: completionsError } = await supabase
      .from("user_training_completions")
      .select("item_id, item_type, completed_at")
      .eq("auth_id", user.auth_id);

    if (completionsError) {
      console.warn("Failed to fetch existing completions:", completionsError);
    }

    // Create a map of completed items for quick lookup
    const completionMap = new Map();
    (existingCompletions || []).forEach(completion => {
      const key = `${completion.item_id}|${completion.item_type}`;
      completionMap.set(key, completion.completed_at);
    });

    // 7. Create new assignments for this user, restoring completion dates where applicable
    const newAssignments = uniqueAssignments.map(a => {
      const itemId = a.document_id || a.module_id;
      const completionKey = `${itemId}|${a.type}`;
      const existingCompletion = completionMap.get(completionKey);
      
      return {
        auth_id: user.auth_id,
        item_id: itemId,
        item_type: a.type,
        assigned_at: new Date().toISOString(),
        // Restore completion date if user previously completed this training
        completed_at: existingCompletion || null
      };
    });

    let addedCount = 0;
    let restoredCompletions = 0;
    if (newAssignments.length > 0) {
      // Count how many completions we're restoring
      restoredCompletions = newAssignments.filter(a => a.completed_at).length;
      
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

    console.log(`✅ Added ${addedCount} new assignments (${restoredCompletions} with restored completion dates)`);

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
      completions_restored: restoredCompletions,
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
