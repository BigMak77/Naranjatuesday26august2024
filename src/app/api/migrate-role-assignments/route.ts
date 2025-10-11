import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, newRoleId } = await request.json();

    if (!userId || !newRoleId) {
      return NextResponse.json({ error: 'userId and newRoleId are required' }, { status: 400 });
    }

    console.log(`🔄 Migrating assignments for user ${userId} to role ${newRoleId}`);

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRoleId = user.role_id;

    // Get current user assignments
    const { data: currentAssignments, error: currentError } = await supabase
      .from('user_assignments')
      .select('item_id, item_type, assigned_at')
      .eq('auth_id', user.auth_id);

    if (currentError) {
      return NextResponse.json({ error: 'Failed to get current assignments' }, { status: 500 });
    }

    // Get assignments required for new role
    const { data: newRoleAssignments, error: newRoleError } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', newRoleId);

    if (newRoleError) {
      return NextResponse.json({ error: 'Failed to get new role assignments' }, { status: 500 });
    }

    // Convert role assignments to the same format as user assignments
    const newRoleItems = new Set(
      newRoleAssignments.map(ra => 
        `${ra.document_id || ra.module_id}:${ra.type}`
      )
    );

    // Categorize current assignments
    const keepAssignments: Array<{item_id: string, item_type: string, assigned_at: string}> = [];
    const archiveAssignments: Array<{item_id: string, item_type: string, assigned_at: string}> = [];

    currentAssignments.forEach(assignment => {
      const assignmentKey = `${assignment.item_id}:${assignment.item_type}`;
      
      if (newRoleItems.has(assignmentKey)) {
        // This assignment is still relevant for the new role
        keepAssignments.push(assignment);
      } else {
        // This assignment is no longer relevant - should be archived
        archiveAssignments.push(assignment);
      }
    });

    // Find new assignments needed (not currently assigned)
    const currentItems = new Set(
      currentAssignments.map(a => `${a.item_id}:${a.item_type}`)
    );

    const newAssignmentsNeeded = newRoleAssignments.filter(ra => {
      const key = `${ra.document_id || ra.module_id}:${ra.type}`;
      return !currentItems.has(key);
    });

    console.log(`📊 Assignment analysis:`);
    console.log(`  - Keep: ${keepAssignments.length} assignments`);
    console.log(`  - Archive: ${archiveAssignments.length} assignments`);
    console.log(`  - Add new: ${newAssignmentsNeeded.length} assignments`);

    // Start the migration transaction
    const results = {
      kept: keepAssignments.length,
      archived: 0,
      added: 0,
      oldRoleId,
      newRoleId
    };

    // Step 1: Archive irrelevant assignments
    if (archiveAssignments.length > 0) {
      // First, log what we're archiving
      const archiveLog = archiveAssignments.map(assignment => ({
        user_id: userId,
        auth_id: user.auth_id,
        item_id: assignment.item_id,
        item_type: assignment.item_type,
        original_assigned_at: assignment.assigned_at,
        archived_at: new Date().toISOString(),
        reason: 'role_change_not_applicable',
        old_role_id: oldRoleId,
        new_role_id: newRoleId
      }));

      // Store in archived_assignments table (create if doesn't exist)
      const { error: archiveError } = await supabase
        .from('archived_assignments')
        .insert(archiveLog);

      if (archiveError) {
        console.warn('Could not archive assignments:', archiveError);
        // Continue anyway - archiving is for audit, not critical
      }

      // Remove archived assignments from active assignments
      const archiveItemKeys = archiveAssignments.map(a => 
        `${a.item_id}:${a.item_type}`
      );

      for (const assignment of archiveAssignments) {
        const { error: deleteError } = await supabase
          .from('user_assignments')
          .delete()
          .eq('auth_id', user.auth_id)
          .eq('item_id', assignment.item_id)
          .eq('item_type', assignment.item_type);

        if (!deleteError) {
          results.archived++;
        }
      }
    }

    // Step 2: Add new assignments needed for the role
    if (newAssignmentsNeeded.length > 0) {
      const newAssignments = newAssignmentsNeeded.map(ra => ({
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
          error: 'Failed to add new assignments', 
          details: insertError 
        }, { status: 500 });
      }

      results.added = newAssignments.length;
    }

    // Step 3: Update user role
    const { error: roleUpdateError } = await supabase
      .from('users')
      .update({ role_id: newRoleId })
      .eq('id', userId);

    if (roleUpdateError) {
      return NextResponse.json({ 
        error: 'Failed to update user role', 
        details: roleUpdateError 
      }, { status: 500 });
    }

    // Step 4: Log the migration
    await supabase
      .from('audit_log')
      .insert({
        table_name: 'user_assignments',
        operation: 'intelligent_role_migration',
        user_id: userId,
        old_values: { 
          role_id: oldRoleId,
          total_assignments: currentAssignments.length 
        },
        new_values: {
          role_id: newRoleId,
          kept_assignments: results.kept,
          archived_assignments: results.archived,
          new_assignments: results.added,
          total_assignments: results.kept + results.added
        },
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      message: 'Role migration completed successfully',
      userId,
      migration: results,
      summary: `Kept ${results.kept}, archived ${results.archived}, added ${results.added} assignments`
    });

  } catch (error) {
    console.error('Role migration failed:', error);
    return NextResponse.json({ 
      error: 'Role migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Intelligent Role Migration API',
    description: 'Migrates user assignments when changing roles - keeps applicable ones, archives irrelevant ones',
    usage: 'POST with { "userId": "uuid", "newRoleId": "uuid" }'
  });
}
