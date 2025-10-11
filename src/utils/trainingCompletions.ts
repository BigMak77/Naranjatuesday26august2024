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
 * Combines current assignments with permanent completion history
 */
export async function getTrainingCompletions(): Promise<TrainingCompletion[]> {
  try {
    // Get current assignments (what users should be working on now)
    const { data: currentAssignments, error: assignmentsError } = await supabase
      .from("user_assignments")
      .select("auth_id, item_id, item_type, completed_at");

    if (assignmentsError) {
      console.error("Error fetching current assignments:", assignmentsError);
      throw assignmentsError;
    }

    // Get all permanent completion records
    const { data: permanentCompletions, error: completionsError } = await supabase
      .from("user_training_completions")
      .select("auth_id, item_id, item_type, completed_at");

    if (completionsError) {
      console.error("Error fetching permanent completions:", completionsError);
      // Don't throw - we can still show current assignments even without completion history
    }

    // Create a comprehensive map of completions
    const completionMap = new Map<string, TrainingCompletion>();

    // First, add all current assignments
    (currentAssignments || []).forEach(assignment => {
      const key = `${assignment.auth_id}|${assignment.item_id}|${assignment.item_type}`;
      completionMap.set(key, {
        ...assignment,
        is_current_assignment: true
      });
    });

    // Then, overlay permanent completions (these take priority for completion dates)
    (permanentCompletions || []).forEach(completion => {
      const key = `${completion.auth_id}|${completion.item_id}|${completion.item_type}`;
      const existing = completionMap.get(key);
      
      if (existing) {
        // Update existing record with completion data from permanent table
        existing.completed_at = completion.completed_at;
      } else {
        // Add completion record for training that's no longer assigned but was completed
        completionMap.set(key, {
          ...completion,
          is_current_assignment: false
        });
      }
    });

    return Array.from(completionMap.values());

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
