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
    console.log(`[API] About to update user ${user_id} in database...`);
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        department_id: new_department_id,
        role_id: new_role_id
      })
      .eq("id", user_id)
      .select();

    if (updateError) {
      console.error("[API] Error updating user - Full error object:", JSON.stringify(updateError, null, 2));
      console.error("[API] Error code:", updateError.code);
      console.error("[API] Error message:", updateError.message);
      console.error("[API] Error details:", updateError.details);
      console.error("[API] Error hint:", updateError.hint);
      return NextResponse.json(
        {
          error: "Failed to update user",
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint
        },
        { status: 500 }
      );
    }

    console.log(`[API] User updated successfully. Updated data:`, updateData);

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

    // Note: Training assignment syncing is handled automatically by database triggers:
    // - trigger_sync_role_training_on_update (for role-based assignments)
    // - trigger_sync_department_training_on_update (for department-based assignments)
    // No need to manually call update-user-role-assignments API

    return NextResponse.json({
      success: true,
      message: "Department and role updated successfully",
      user_id,
      new_department_id,
      new_role_id,
      history_recorded: !historyError
    });
  } catch (error: any) {
    console.error("[API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
