import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create a Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      old_department_id,
      old_role_id,
      new_department_id,
      new_role_id,
      changed_by,
      change_reason
    } = body;

    // Validate required fields
    if (!user_id || !new_department_id || !new_role_id) {
      return NextResponse.json(
        { error: "Missing required fields: user_id, new_department_id, new_role_id" },
        { status: 400 }
      );
    }

    if (!change_reason || !change_reason.trim()) {
      return NextResponse.json(
        { error: "Change reason is required" },
        { status: 400 }
      );
    }

    console.log(`[API] Changing department/role for user ${user_id}`);
    console.log(`[API] From: dept=${old_department_id}, role=${old_role_id}`);
    console.log(`[API] To: dept=${new_department_id}, role=${new_role_id}`);
    console.log(`[API] Reason: ${change_reason}`);

    // 1. Update the users table
    const { error: updateError } = await supabase
      .from("users")
      .update({
        department_id: new_department_id,
        role_id: new_role_id
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("[API] Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user", details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`[API] User updated successfully`);

    // 2. Insert into user_role_history table
    const { error: historyError } = await supabase
      .from("user_role_history")
      .insert({
        user_id,
        old_role_id: old_role_id || null,
        old_department_id: old_department_id || null,
        new_role_id,
        new_department_id,
        changed_by: changed_by || null,
        change_reason: change_reason.trim(),
        changed_at: new Date().toISOString()
      });

    if (historyError) {
      console.error("[API] Error inserting role history:", historyError);
      // Don't fail the request - the user update was successful
    } else {
      console.log(`[API] Role history recorded successfully`);
    }

    // 3. Sync training assignments if role changed
    let assignmentsSynced = false;
    if (new_role_id !== old_role_id) {
      try {
        console.log(`[API] Role changed, syncing training assignments...`);

        // Call the existing update-user-role-assignments API
        const syncResponse = await fetch(`${request.nextUrl.origin}/api/update-user-role-assignments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id,
            old_role_id,
            new_role_id
          })
        });

        if (!syncResponse.ok) {
          const errorText = await syncResponse.text();
          console.warn("[API] Failed to sync role assignments:", errorText);
        } else {
          const syncResult = await syncResponse.json();
          console.log("[API] Role assignments synced:", syncResult);
          assignmentsSynced = true;
        }
      } catch (syncErr) {
        console.warn("[API] Error syncing role assignments:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Department and role updated successfully",
      user_id,
      new_department_id,
      new_role_id,
      history_recorded: !historyError,
      assignments_synced: assignmentsSynced
    });
  } catch (error: any) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
