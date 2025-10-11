import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Automatically sync user training assignments when their role changes
 * Call this function whenever updating a user's role_id in the database
 */
export async function syncUserRoleChange(
  userId: string, 
  newRoleId: string, 
  oldRoleId?: string
) {
  try {
    console.log(`🔄 Auto-syncing role change: User ${userId} → Role ${newRoleId}`);

    const response = await fetch('/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        old_role_id: oldRoleId,
        new_role_id: newRoleId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Role sync completed:`, result);
      return result;
    } else {
      console.error(`❌ Role sync failed:`, result);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Auto role sync error:', error);
    throw error;
  }
}

/**
 * Batch sync all users' training assignments
 * Useful for maintenance or initial setup
 */
export async function batchSyncAllUsers() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, role_id')
      .not('role_id', 'is', null);

    if (error) throw error;

    console.log(`🔄 Batch syncing ${users.length} users...`);
    
    const results = [];
    for (const user of users) {
      try {
        const result = await syncUserRoleChange(user.id, user.role_id);
        results.push({ user_id: user.id, success: true, ...result });
      } catch (error) {
        results.push({ 
          user_id: user.id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`✅ Batch sync completed: ${successful}/${users.length} successful`);
    
    return results;
  } catch (error) {
    console.error('Batch sync error:', error);
    throw error;
  }
}

/**
 * Helper to update user role with automatic assignment sync
 * Use this instead of direct database updates
 * This will REMOVE all old assignments and ADD new ones
 */
export async function updateUserRole(userId: string, newRoleId: string) {
  try {
    console.log(`🔄 Updating user ${userId} to role ${newRoleId} with assignment cleanup`);

    const response = await fetch('/api/change-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        new_role_id: newRoleId
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Role updated successfully:`, result);
      return result;
    } else {
      console.error(`❌ Role update failed:`, result);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Update user role error:', error);
    throw error;
  }
}
