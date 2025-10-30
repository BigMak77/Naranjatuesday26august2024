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
      // Get assignments for the old role (modules and documents)
      const { data: oldRoleAssignments } = await supabase
        .from("role_assignments")
        .select("module_id, document_id, type")
        .eq("role_id", old_role_id);

      console.log(`Found ${oldRoleAssignments?.length || 0} old role assignments to remove`);

      if (oldRoleAssignments && oldRoleAssignments.length > 0) {
        // Build a list of (item_id, item_type) pairs to delete
        const itemsToDelete = oldRoleAssignments
          .map(a => ({
            item_id: a.module_id || a.document_id,
            item_type: a.type
          }))
          .filter(item => item.item_id); // Filter out any null values

        console.log(`Built ${itemsToDelete.length} item pairs to delete`);

        // Delete user assignments by matching (auth_id, item_id, item_type)
        // We'll delete them one by one or in batches
        for (const item of itemsToDelete) {
          const { error: deleteError, count } = await supabase
            .from("user_assignments")
            .delete({ count: 'exact' })
            .eq("auth_id", user.auth_id)
            .eq("item_id", item.item_id)
            .eq("item_type", item.item_type);

          if (!deleteError && count) {
            removedCount += count;
          } else if (deleteError) {
            console.error(`Failed to remove assignment for ${item.item_type} ${item.item_id}:`, deleteError);
          }
        }

        console.log(`Successfully removed ${removedCount} assignments for old role`);
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
