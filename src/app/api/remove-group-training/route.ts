import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { groupId, userIds } = await req.json();

    if (!groupId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Group ID and user IDs are required" },
        { status: 400 }
      );
    }

    // Get group assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("training_group_assignments")
      .select("item_id, item_type")
      .eq("group_id", groupId);

    if (assignmentsError) {
      console.error("Error fetching group assignments:", assignmentsError);
      return NextResponse.json(
        { error: assignmentsError.message },
        { status: 500 }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No assignments to remove",
      });
    }

    // Get auth_ids for the provided user_ids
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("auth_id")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: usersError.message },
        { status: 500 }
      );
    }

    const authIds = (users || []).map((u) => u.auth_id);

    if (authIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users found",
      });
    }

    // Remove incomplete user assignments for these users and group items
    for (const assignment of assignments) {
      const { error: deleteError } = await supabase
        .from("user_assignments")
        .delete()
        .in("auth_id", authIds)
        .eq("item_id", assignment.item_id)
        .eq("item_type", assignment.item_type)
        .is("completed_at", null); // Only remove incomplete assignments

      if (deleteError) {
        console.error("Error deleting user assignments:", deleteError);
        // Continue with other deletions even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Group training removed successfully",
    });
  } catch (error: any) {
    console.error("Error in remove-group-training:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
