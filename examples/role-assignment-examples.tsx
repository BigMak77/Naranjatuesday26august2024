import { updateUserRole, syncUserRoleChange, batchSyncAllUsers } from '@/utils/roleAssignmentSync';

// Example 1: Update user role in your admin interface
export async function handleUserRoleUpdate(userId: string, newRoleId: string) {
  try {
    // This will automatically sync training assignments
    const result = await updateUserRole(userId, newRoleId);
    
    console.log('✅ User role updated successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to update user role:', error);
    throw error;
  }
}

// Example 2: Bulk role assignment (e.g., new department)
export async function assignRoleToMultipleUsers(userIds: string[], roleId: string) {
  const results = [];
  
  for (const userId of userIds) {
    try {
      const result = await updateUserRole(userId, roleId);
      results.push({ userId, success: true, ...result });
    } catch (error) {
      results.push({ 
        userId, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  return results;
}

// Example 3: React component for role management
import { useState } from 'react';

export function UserRoleManager({ user, availableRoles, onRoleUpdate }) {
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  const handleRoleChange = async (newRoleId: string) => {
    setUpdating(true);
    setMessage('');
    
    try {
      await updateUserRole(user.id, newRoleId);
      setMessage('✅ Role updated and training assignments synced!');
      onRoleUpdate?.(user.id, newRoleId);
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="role-manager">
      <h3>Update Role for {user.first_name} {user.last_name}</h3>
      
      <select 
        value={user.role_id} 
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={updating}
      >
        {availableRoles.map(role => (
          <option key={role.id} value={role.id}>
            {role.title}
          </option>
        ))}
      </select>
      
      {updating && <p>🔄 Updating role and syncing assignments...</p>}
      {message && <p>{message}</p>}
    </div>
  );
}

// Example 4: API endpoint for role updates
// src/app/api/users/[id]/role/route.ts
import { NextRequest, NextResponse } from 'next/server';
// import { updateUserRole } from '@/utils/roleAssignmentSync'; // Already imported at top

export async function PUT(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { role_id } = await req.json();
    
    if (!role_id) {
      return NextResponse.json({ error: 'Missing role_id' }, { status: 400 });
    }
    
    const result = await updateUserRole(params.id, role_id);
    
    return NextResponse.json({
      message: 'Role updated successfully',
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

// Example 5: Scheduled maintenance sync
// Run this periodically to ensure all assignments are up to date
export async function scheduledMaintenanceSync() {
  console.log('🔄 Starting scheduled maintenance sync...');
  
  try {
    const results = await batchSyncAllUsers();
    const successful = results.filter(r => r.success).length;
    
    console.log(`✅ Maintenance sync completed: ${successful}/${results.length} users synced`);
    
    // Log failures for investigation
    const failures = results.filter(r => !r.success);
    if (failures.length > 0) {
      console.warn('❌ Sync failures:', failures);
    }
    
    return { successful, total: results.length, failures: failures.length };
  } catch (error) {
    console.error('❌ Scheduled sync failed:', error);
    throw error;
  }
}
