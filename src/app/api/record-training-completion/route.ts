import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { auth_id, item_id, item_type } = await req.json();

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

    const completedAt = new Date().toISOString();

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

    // Update the current assignment record
    const { error: assignmentError } = await supabase
      .from("user_assignments")
      .update({ completed_at: completedAt })
      .eq("auth_id", auth_id)
      .eq("item_id", item_id)
      .eq("item_type", item_type);

    if (assignmentError) {
      console.warn("Could not update assignment record:", assignmentError);
      // Don't fail the request - the completion is still recorded
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
