import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { groupId, userIds } = await req.json();

    if (!groupId) {
      return NextResponse.json(
        { error: "Group ID is required" },
        { status: 400 }
      );
    }

    // If specific userIds provided, sync only for those users
    // Otherwise, sync for all group members
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Sync for specific users
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
          message: "No assignments to sync",
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

      // Create user assignments
      const userAssignments = authIds.flatMap((authId) =>
        assignments.map((assignment) => ({
          auth_id: authId,
          item_id: assignment.item_id,
          item_type: assignment.item_type,
          assigned_at: new Date().toISOString(),
        }))
      );

      if (userAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("user_assignments")
          .upsert(userAssignments, {
            onConflict: "auth_id,item_id,item_type",
            ignoreDuplicates: true,
          });

        if (insertError) {
          console.error("Error inserting user assignments:", insertError);
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }
      }
    } else {
      // Sync for all group members
      const { data: members, error: membersError } = await supabase
        .from("training_group_members")
        .select("user_id, users!inner(auth_id)")
        .eq("group_id", groupId);

      if (membersError) {
        console.error("Error fetching group members:", membersError);
        return NextResponse.json(
          { error: membersError.message },
          { status: 500 }
        );
      }

      if (!members || members.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No members to sync",
        });
      }

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
          message: "No assignments to sync",
        });
      }

      // Create user assignments for all members
      const userAssignments = members.flatMap((member: any) =>
        assignments.map((assignment) => ({
          auth_id: member.users.auth_id,
          item_id: assignment.item_id,
          item_type: assignment.item_type,
          assigned_at: new Date().toISOString(),
        }))
      );

      if (userAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("user_assignments")
          .upsert(userAssignments, {
            onConflict: "auth_id,item_id,item_type",
            ignoreDuplicates: true,
          });

        if (insertError) {
          console.error("Error inserting user assignments:", insertError);
          return NextResponse.json(
            { error: insertError.message },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Group training synced successfully",
    });
  } catch (error: any) {
    console.error("Error in sync-group-training:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
