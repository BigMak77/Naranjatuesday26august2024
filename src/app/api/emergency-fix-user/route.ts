import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('🚨 Emergency Fix: Starting user assignment sync for:', userId);
    
    // Step 1: Get user's current role and auth_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id, auth_id, id')
      .eq('id', userId)
      .single();
      
    if (userError || !user) {
      console.error('❌ Error fetching user:', userError);
      return NextResponse.json({ error: 'User not found', details: userError }, { status: 404 });
    }
    
    console.log('✅ User found:', { role_id: user.role_id, auth_id: user.auth_id });
    
    // Step 2: Count current assignments
    const { count: currentCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', user.auth_id);
      
    console.log('📊 Current assignments:', currentCount);
    
    // Step 3: Get role requirements
    const { data: roleAssignments, error: roleError } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', user.role_id);
      
    if (roleError) {
      console.error('❌ Error fetching role assignments:', roleError);
      return NextResponse.json({ error: 'Role assignments not found', details: roleError }, { status: 500 });
    }
    
    console.log('📋 Role requires assignments:', roleAssignments.length);
    
    // Step 4: Remove all current assignments (clean slate)
    const { error: deleteError } = await supabase
      .from('user_assignments')
      .delete()
      .eq('auth_id', user.auth_id);
      
    if (deleteError) {
      console.error('❌ Error deleting old assignments:', deleteError);
      return NextResponse.json({ error: 'Failed to delete old assignments', details: deleteError }, { status: 500 });
    }
    
    console.log('🗑️ Removed all old assignments');
    
    // Step 5: Insert new assignments based on current role
    if (roleAssignments.length > 0) {
      const newAssignments = roleAssignments.map(ra => ({
        auth_id: user.auth_id,
        module_id: ra.module_id,
        document_id: ra.document_id,
        type: ra.type,
        assigned_at: new Date().toISOString()
      }));
      
      const { data: insertedAssignments, error: insertError } = await supabase
        .from('user_assignments')
        .insert(newAssignments)
        .select();
        
      if (insertError) {
        console.error('❌ Error inserting new assignments:', insertError);
        return NextResponse.json({ error: 'Failed to insert new assignments', details: insertError }, { status: 500 });
      }
      
      console.log('✅ Inserted new assignments:', insertedAssignments.length);
    }
    
    // Step 6: Verify final state
    const { count: finalCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', user.auth_id);
      
    console.log('📊 Final assignment count:', finalCount);
    
    // Step 7: Log the fix
    const auditEntry = {
      table_name: 'user_assignments',
      operation: 'emergency_fix',
      user_id: user.id,
      old_values: { assignments_count: currentCount },
      new_values: { assignments_count: finalCount },
      timestamp: new Date().toISOString()
    };
    
    const { error: auditError } = await supabase
      .from('audit_log')
      .insert(auditEntry);
      
    if (auditError) {
      console.warn('⚠️ Could not log audit entry:', auditError);
    }
    
    const result = {
      message: 'Emergency fix completed successfully',
      userId: user.id,
      roleId: user.role_id,
      assignmentsBefore: currentCount,
      assignmentsAfter: finalCount,
      expectedAssignments: roleAssignments.length,
      status: finalCount === roleAssignments.length ? 'SUCCESS' : 'MISMATCH',
      timestamp: new Date().toISOString()
    };
    
    console.log('🎉 Emergency fix result:', result);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('💥 Emergency fix failed:', error);
    return NextResponse.json({ 
      error: 'Emergency fix failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Emergency User Assignment Fix API',
    usage: 'POST with { "userId": "uuid" } to fix user assignments',
    description: 'Removes all assignments and re-adds based on current role'
  });
}
