import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action, userId, newRoleId } = await request.json();

    switch (action) {
      case 'scan':
        return await handleScan();
      case 'validate':
        return await handleValidate(userId, newRoleId);
      case 'sync-assignments':
        return await handleSyncAssignments(userId);
      case 'bulk-fix':
        return await handleBulkFix();
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

async function handleScan() {
  console.log('🔍 Scanning for users with legacy assignments...');
  
  // Get all users with roles
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, auth_id, role_id')
    .not('role_id', 'is', null);
    
  if (usersError) {
    return NextResponse.json({ error: 'Failed to fetch users', details: usersError }, { status: 500 });
  }

  const problemUsers = [];
  
  for (const user of users) {
    // Count current assignments
    const { count: currentCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', user.auth_id);
      
    // Count expected assignments for their role
    const { count: expectedCount } = await supabase
      .from('role_assignments')
      .select('*', { count: 'exact' })
      .eq('role_id', user.role_id);
      
    const current = currentCount ?? 0;
    const expected = expectedCount ?? 0;
    
    if (current !== expected) {
      problemUsers.push({
        user_id: user.id,
        role_id: user.role_id,
        auth_id: user.auth_id,
        current_assignments: current,
        expected_assignments: expected,
        mismatch: current - expected
      });
    }
  }

  return NextResponse.json({
    message: 'Scan completed',
    totalUsers: users.length,
    problemUsers: problemUsers.length,
    users: problemUsers
  });
}

async function handleValidate(userId: string, newRoleId: string) {
  if (!userId || !newRoleId) {
    return NextResponse.json({ error: 'userId and newRoleId required' }, { status: 400 });
  }

  // Get user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, role_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Get current assignments count
  const { count: currentAssignments } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact' })
    .eq('auth_id', user.auth_id);

  // Get expected assignments for new role
  const { count: newRoleAssignments } = await supabase
    .from('role_assignments')
    .select('*', { count: 'exact' })
    .eq('role_id', newRoleId);

  return NextResponse.json({
    message: 'Validation completed',
    user: {
      id: user.id,
      currentRoleId: user.role_id,
      newRoleId
    },
    assignments: {
      current: currentAssignments,
      expected: newRoleAssignments,
      willChange: currentAssignments !== newRoleAssignments
    }
  });
}

async function handleSyncAssignments(userId: string) {
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  console.log(`🔧 Syncing assignments for user: ${userId}`);

  // Get user info
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, role_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Count assignments before
  const { count: assignmentsBefore } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact' })
    .eq('auth_id', user.auth_id);

  // STEP 1: Delete ALL current assignments
  console.log('🗑️ Deleting all current assignments...');
  const { error: deleteError } = await supabase
    .from('user_assignments')
    .delete()
    .eq('auth_id', user.auth_id);

  if (deleteError) {
    return NextResponse.json({ 
      error: 'Failed to delete old assignments', 
      details: deleteError 
    }, { status: 500 });
  }

  // STEP 2: Get role assignments
  const { data: roleAssignments, error: roleError } = await supabase
    .from('role_assignments')
    .select('module_id, document_id, type')
    .eq('role_id', user.role_id);

  if (roleError) {
    return NextResponse.json({ 
      error: 'Failed to get role assignments', 
      details: roleError 
    }, { status: 500 });
  }

  // STEP 3: Insert new assignments
  let assignmentsAfter = 0;
  if (roleAssignments && roleAssignments.length > 0) {
    console.log(`➕ Adding ${roleAssignments.length} new assignments...`);
    
    const newAssignments = roleAssignments.map(ra => ({
      auth_id: user.auth_id,
      item_id: ra.document_id || ra.module_id,
      item_type: ra.type,
      assigned_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('user_assignments')
      .insert(newAssignments);

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to insert new assignments', 
        details: insertError 
      }, { status: 500 });
    }

    assignmentsAfter = newAssignments.length;
  }

  // Log the sync
  await supabase
    .from('audit_log')
    .insert({
      table_name: 'user_assignments',
      operation: 'staged_assignment_sync',
      user_id: user.id,
      old_values: { count: assignmentsBefore },
      new_values: { count: assignmentsAfter },
      timestamp: new Date().toISOString()
    });

  return NextResponse.json({
    message: 'Assignment sync completed',
    userId: user.id,
    roleId: user.role_id,
    results: {
      assignmentsBefore,
      assignmentsAfter,
      success: true
    }
  });
}

async function handleBulkFix() {
  console.log('🚨 Starting bulk fix for all users with legacy assignments...');
  
  // First scan to find problem users
  const scanResponse = await handleScan();
  const scanData = await scanResponse.json();
  
  if (scanData.problemUsers === 0) {
    return NextResponse.json({
      message: 'No users need fixing',
      results: { fixed: 0, errors: 0 }
    });
  }

  let fixed = 0;
  let errors = 0;
  const results = [];

  // Fix each problem user
  for (const problemUser of scanData.users) {
    try {
      const syncResponse = await handleSyncAssignments(problemUser.user_id);
      const syncData = await syncResponse.json();
      
      if (syncResponse.ok) {
        fixed++;
        results.push({
          userId: problemUser.user_id,
          status: 'fixed',
          before: problemUser.current_assignments,
          after: syncData.results.assignmentsAfter
        });
      } else {
        errors++;
        results.push({
          userId: problemUser.user_id,
          status: 'error',
          error: syncData.error
        });
      }
    } catch (error) {
      errors++;
      results.push({
        userId: problemUser.user_id,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({
    message: 'Bulk fix completed',
    totalProcessed: scanData.problemUsers,
    results: {
      fixed,
      errors,
      details: results
    }
  });
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Staged Role Assignment Manager API',
    actions: [
      'POST with { "action": "scan" } - Find users with legacy assignments',
      'POST with { "action": "validate", "userId": "...", "newRoleId": "..." } - Validate role change',
      'POST with { "action": "sync-assignments", "userId": "..." } - Sync assignments for user',
      'POST with { "action": "bulk-fix" } - Fix all users with legacy assignments'
    ]
  });
}
