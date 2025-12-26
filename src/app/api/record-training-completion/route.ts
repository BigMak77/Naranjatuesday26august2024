import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { auth_id, item_id, item_type, completed_date, training_outcome, linked_document_ids } = await req.json();

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

    console.log(`📚 Recording training outcome: ${auth_id} for ${item_type} ${item_id}`);
    console.log(`📊 Outcome: ${training_outcome || 'not specified (default: completed)'}`);

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

    // Normalize training outcome
    const outcome = training_outcome || 'completed';
    const validOutcomes = ['completed', 'needs_improvement', 'failed'];

    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json({
        error: `Invalid training_outcome. Must be one of: ${validOutcomes.join(', ')}`
      }, { status: 400 });
    }

    // Get module data to check for follow-up requirements (only for modules)
    let followUpAssessmentDueDate = null;
    let followUpAssessmentRequired = false;
    let refreshDueDate = null;

    if (item_type === 'module') {
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("requires_follow_up, follow_up_period, refresh_period")
        .eq("id", item_id)
        .single();

      if (moduleError) {
        console.warn("Could not fetch module data:", moduleError);
      } else {
        console.log(`📋 Module data: requires_follow_up=${moduleData?.requires_follow_up}, follow_up_period=${moduleData?.follow_up_period}, refresh_period=${moduleData?.refresh_period}`);
      }

      // ONLY create follow-up assessment if training was completed satisfactorily
      if (outcome === 'completed' && moduleData && moduleData.requires_follow_up && moduleData.follow_up_period !== "0") {
        followUpAssessmentRequired = true;
        // Calculate the follow-up assessment due date based on follow_up_period
        const completed = new Date(completedAt);
        const period = moduleData.follow_up_period;

        console.log(`⏰ Calculating follow-up assessment due date from training date ${completedAt} with period: ${period}`);

        if (period === "1 week") {
          completed.setDate(completed.getDate() + 7);
        } else if (period === "2 weeks") {
          completed.setDate(completed.getDate() + 14);
        } else if (period === "1 month") {
          completed.setMonth(completed.getMonth() + 1);
        } else if (period === "3 months") {
          completed.setMonth(completed.getMonth() + 3);
        }

        followUpAssessmentDueDate = completed.toISOString();
        console.log(`✅ Follow-up assessment due date set to: ${followUpAssessmentDueDate}`);
      } else {
        console.log("ℹ️ No follow-up assessment required (outcome not 'completed' or module doesn't require it)");
      }

      // ONLY create refresh training schedule if training was completed satisfactorily
      if (outcome === 'completed' && moduleData && moduleData.refresh_period && moduleData.refresh_period !== "Never" && moduleData.refresh_period !== "0") {
        // Calculate the refresh training due date based on refresh_period
        const completed = new Date(completedAt);
        const period = moduleData.refresh_period;

        console.log(`🔄 Calculating refresh training due date from training date ${completedAt} with period: ${period}`);

        if (period === "6 months") {
          completed.setMonth(completed.getMonth() + 6);
        } else if (period === "1 year") {
          completed.setFullYear(completed.getFullYear() + 1);
        } else if (period === "2 years") {
          completed.setFullYear(completed.getFullYear() + 2);
        } else if (period === "3 years") {
          completed.setFullYear(completed.getFullYear() + 3);
        }

        refreshDueDate = completed.toISOString();
        console.log(`✅ Refresh training due date set to: ${refreshDueDate}`);
      } else {
        console.log("ℹ️ No refresh training required (outcome not 'completed' or module doesn't require it)");
      }
    }

    // Build the update data based on the outcome
    const updateData: any = {
      training_outcome: outcome
    };

    // Only mark as completed if outcome is 'completed'
    if (outcome === 'completed') {
      updateData.completed_at = completedAt;

      // TODO: Uncomment these when follow-up system migration is applied
      // updateData.follow_up_assessment_required = followUpAssessmentRequired;
      // if (followUpAssessmentDueDate) {
      //   updateData.follow_up_assessment_due_date = followUpAssessmentDueDate;
      // }
      // if (refreshDueDate) {
      //   updateData.refresh_due_date = refreshDueDate;
      // }
    }
    // If outcome is 'needs_improvement' or 'failed', assignment stays open (completed_at remains NULL)

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
      return NextResponse.json({
        error: "Failed to update assignment",
        details: assignmentError.message
      }, { status: 500 });
    }

    console.log("✅ Assignment record updated:", updatedAssignment);
    console.log("🔍 Verifying completed_at in database:", updatedAssignment?.[0]?.completed_at);
    console.log("🔍 Verifying training_outcome in database:", updatedAssignment?.[0]?.training_outcome);

    // Note: When outcome is 'needs_improvement' or 'failed', the assignment stays open (completed_at remains NULL)
    // The user can attempt the training again, and the duplicate check below prevents duplicate log entries on the same date

    // 2) Upsert into training_logs for completion tracking
    // Note: We now log ALL outcomes (completed, needs_improvement, failed) to track training history
    // Using upsert to update if already exists for this user/item/date
    console.log("📝 Upserting training log entry...");

    // Extract date from completedAt (YYYY-MM-DD format)
    const trainingDate = completedAt.split('T')[0];

    const { error: logError } = await supabase
      .from("training_logs")
      .upsert({
        auth_id: auth_id,
        date: trainingDate,
        topic: item_id, // module or document ID
        duration_hours: 1, // Default duration
        outcome: outcome, // Use the actual outcome (completed, needs_improvement, or failed)
        notes: `Auto-logged from ${item_type} completion`,
        signature: null, // No signature for auto-logged completions
        trainer_signature: null,
        time: new Date(completedAt).toTimeString().split(' ')[0] // Extract HH:MM:SS
      }, {
        onConflict: 'auth_id,topic,date',
        ignoreDuplicates: false
      });

    if (logError) {
      console.warn("⚠️ Failed to upsert training log (non-critical):", logError.message);
      // Don't fail the whole operation if logging fails
    } else {
      console.log("✅ Training log entry upserted successfully");
    }

    // 3) Auto-complete linked documents if module completed successfully
    let completedDocuments = 0;
    if (outcome === 'completed' && item_type === 'module' && linked_document_ids && Array.isArray(linked_document_ids) && linked_document_ids.length > 0) {
      console.log(`📄 Auto-completing ${linked_document_ids.length} linked documents for module ${item_id}...`);

      for (const documentId of linked_document_ids) {
        try {
          const { error: docError } = await supabase
            .from("user_assignments")
            .update({
              completed_at: completedAt,
              training_outcome: 'completed'
            })
            .eq("auth_id", auth_id)
            .eq("item_id", documentId)
            .eq("item_type", "document");

          if (docError) {
            console.warn(`⚠️ Failed to complete document ${documentId}:`, docError.message);
          } else {
            completedDocuments++;
            console.log(`✅ Document ${documentId} marked as completed`);
          }
        } catch (err) {
          console.warn(`⚠️ Error completing document ${documentId}:`, err);
        }
      }

      console.log(`📊 Auto-completed ${completedDocuments}/${linked_document_ids.length} linked documents`);
    }

    // Prepare response message based on outcome
    let message = "";
    if (outcome === 'completed') {
      message = completedDocuments > 0
        ? `Training completed successfully. ${completedDocuments} linked document(s) also marked as complete.`
        : "Training completed successfully";
    } else if (outcome === 'needs_improvement') {
      message = "Training outcome recorded as 'needs improvement' - assignment remains open for re-training";
    } else if (outcome === 'failed') {
      message = "Training outcome recorded as 'failed' - assignment remains open for re-training";
    }

    console.log(`✅ ${message}`);

    return NextResponse.json({
      message,
      auth_id,
      item_id,
      item_type,
      training_outcome: outcome,
      completed_at: outcome === 'completed' ? completedAt : null,
      follow_up_assessment_required: followUpAssessmentRequired,
      follow_up_assessment_due_date: followUpAssessmentDueDate,
      refresh_due_date: refreshDueDate,
      role_id: user?.role_id || null,
      linked_documents_completed: completedDocuments
    });

  } catch (err) {
    const error = err as Error;
    console.error("Training completion error:", error);
    return NextResponse.json({
      error: "Failed to record training outcome",
      details: error.message
    }, { status: 500 });
  }
}
