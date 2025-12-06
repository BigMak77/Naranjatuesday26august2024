import { supabase } from "@/lib/supabase-client";

export interface TrainingCompletion {
  auth_id: string;
  item_id: string;
  item_type: string;
  completed_at: string | null;
  is_current_assignment: boolean;
}

/**
 * Gets comprehensive training completion data for the TrainingMatrix
 * Uses user_assignments as the single source of truth for both current and historical completions
 */
export async function getTrainingCompletions(): Promise<TrainingCompletion[]> {
  try {
    // Get all assignments (current and completed)
    // Completed assignments remain in the table with their completion dates preserved
    const { data: assignments, error: assignmentsError } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type, completed_at");

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
      throw assignmentsError;
    }

    // Map assignments to completion records
    const completions: TrainingCompletion[] = (assignments || []).map(assignment => ({
      auth_id: assignment.auth_id,
      item_id: assignment.item_id,
      item_type: assignment.item_type,
      completed_at: assignment.completed_at,
      is_current_assignment: true // All records in user_assignments are considered active
    }));

    return completions;

  } catch (error) {
    console.error("Error getting training completions:", error);
    throw error;
  }
}

/**
 * Records a new training completion
 */
export async function recordTrainingCompletion(
  auth_id: string, 
  item_id: string, 
  item_type: 'module' | 'document'
): Promise<void> {
  try {
    const response = await fetch('/api/record-training-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_id,
        item_id,
        item_type
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to record completion');
    }

    console.log(`✅ Training completion recorded: ${item_type} ${item_id}`);
  } catch (error) {
    console.error("Error recording training completion:", error);
    throw error;
  }
}
