import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { auth_id, item_id, item_type, completed_date } = await req.json();

    if (!auth_id || !item_id || !item_type) {
      return NextResponse.json({
        error: "Missing required fields: auth_id, item_id, item_type"
      }, { status: 400 });
    }

    if (!['module', 'document'].includes(item_type)) {
      return NextResponse.json({
        error: "item_type must be 'module' or 'document'"
      }, { status: 400 });
    }

    console.log(`📚 Recording training completion: ${auth_id} completed ${item_type} ${item_id}`);

    // Get user's current role for tracking
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role_id")
      .eq("auth_id", auth_id)
      .single();

    if (userError) {
      console.warn("Could not fetch user role:", userError);
    }

    // Use the provided completion date (from training log) or default to now
    // This is important so follow-up dates are based on actual training date, not today
    let completedAt: string;
    if (completed_date) {
      // If date is in YYYY-MM-DD format, convert to full ISO timestamp
      if (completed_date.length === 10 && !completed_date.includes('T')) {
        completedAt = new Date(completed_date + 'T00:00:00Z').toISOString();
      } else {
        completedAt = new Date(completed_date).toISOString();
      }
    } else {
      completedAt = new Date().toISOString();
    }
    console.log(`📅 Training completion date: ${completedAt} (original: ${completed_date || 'not provided'})`);

    // Record the completion in permanent table
    const { error: completionError } = await supabase
      .from("user_training_completions")
      .upsert({
        auth_id,
        item_id,
        item_type,
        completed_at: completedAt,
        completed_by_role_id: user?.role_id || null
      }, {
        onConflict: 'auth_id,item_id,item_type'
      });

    if (completionError) {
      console.error("Error recording completion:", completionError);
      return NextResponse.json({
        error: "Failed to record completion",
        details: completionError
      }, { status: 500 });
    }

    // Get module data to check for follow-up requirements (only for modules)
    let followUpDueDate = null;
    let followUpRequired = false;
    if (item_type === 'module') {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("requires_follow_up, review_period")
        .eq("id", item_id)
        .single();

      if (moduleError) {
        console.warn("Could not fetch module data:", moduleError);
      } else {
        console.log(`📋 Module data: requires_follow_up=${moduleData?.requires_follow_up}, review_period=${moduleData?.review_period}`);
      }

      if (moduleData && moduleData.requires_follow_up && moduleData.review_period !== "0") {
        followUpRequired = true;
        // Calculate the follow-up due date based on review_period
        // IMPORTANT: Use the actual training completion date, not today's date
        const completed = new Date(completedAt);
        const period = moduleData.review_period;

        console.log(`⏰ Calculating follow-up due date from training date ${completedAt} with period: ${period}`);

        if (period === "1 week") {
          completed.setDate(completed.getDate() + 7);
        } else if (period === "2 weeks") {
          completed.setDate(completed.getDate() + 14);
        } else if (period === "1 month") {
          completed.setMonth(completed.getMonth() + 1);
        } else if (period === "3 months") {
          completed.setMonth(completed.getMonth() + 3);
        }

        followUpDueDate = completed.toISOString();
        console.log(`✅ Follow-up due date set to: ${followUpDueDate}`);
      } else {
        console.log("ℹ️ No follow-up required for this module");
      }
    }

    // Update the current assignment record
    const updateData: any = {
      completed_at: completedAt,
      follow_up_required: followUpRequired
    };
    if (followUpDueDate) {
      updateData.follow_up_due_date = followUpDueDate;
    }

    console.log("📝 Updating user_assignments with:", updateData);

    const { data: updatedAssignment, error: assignmentError } = await supabase
      .from("user_assignments")
      .update(updateData)
      .eq("auth_id", auth_id)
      .eq("item_id", item_id)
      .eq("item_type", item_type)
      .select();

    if (assignmentError) {
      console.error("❌ Could not update assignment record:", assignmentError);
      // Don't fail the request - the completion is still recorded
    } else {
      console.log("✅ Assignment record updated:", updatedAssignment);
    }

    console.log(`✅ Training completion recorded successfully`);

    return NextResponse.json({
      message: "Training completion recorded successfully",
      auth_id,
      item_id,
      item_type,
      completed_at: completedAt,
      role_id: user?.role_id || null
    });

  } catch (err) {
    const error = err as Error;
    console.error("Training completion error:", error);
    return NextResponse.json({ 
      error: "Failed to record training completion", 
      details: error.message 
    }, { status: 500 });
  }
}
