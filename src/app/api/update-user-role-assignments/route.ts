import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
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

    // 2. Remove old role assignments if old_role_id provided
    let removedCount = 0;
    if (old_role_id) {
      // Get assignments for the old role including the role_assignment id
      const { data: oldRoleAssignments } = await supabase
        .from("role_assignments")
        .select("id, item_id, type")
        .eq("role_id", old_role_id);

      console.log(`Found ${oldRoleAssignments?.length || 0} old role assignments to remove`);

      if (oldRoleAssignments && oldRoleAssignments.length > 0) {
        // Remove user assignments that match the old role using role_assignment_id
        const oldRoleAssignmentIds = oldRoleAssignments.map(a => a.id);
        
        // First check if assignments exist to count them
        const { count: existingCount } = await supabase
          .from("user_assignments")
          .select("*", { count: "exact" })
          .eq("auth_id", user.auth_id)
          .in("role_assignment_id", oldRoleAssignmentIds);
          
        console.log(`Found ${existingCount || 0} existing assignments to remove for old role`);
        
        // Then delete them using role_assignment_id
        if (existingCount && existingCount > 0) {
          const { error: deleteError } = await supabase
            .from("user_assignments")
            .delete()
            .eq("auth_id", user.auth_id)
            .in("role_assignment_id", oldRoleAssignmentIds);
            
          if (!deleteError) {
            console.log(`Successfully removed ${existingCount} assignments for old role`);
            removedCount = existingCount;
          } else {
            console.error(`Failed to remove assignments for old role:`, deleteError);
          }
        }
      }
    }

    // 3. Update user's role_id BEFORE syncing assignments
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

    // 4. Add new role assignments
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

    // 5. Log the role change
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
