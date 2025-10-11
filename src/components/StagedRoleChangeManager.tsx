import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface StageStatus {
  completed: boolean;
  loading: boolean;
  result?: any;
  error?: string;
}

export default function StagedRoleChangeManager() {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newRoleId, setNewRoleId] = useState<string>('');
  
  const [stages, setStages] = useState<Record<string, StageStatus>>({
    validate: { completed: false, loading: false },
    backup: { completed: false, loading: false },
    changeRole: { completed: false, loading: false },
    syncAssignments: { completed: false, loading: false },
    verify: { completed: false, loading: false }
  });

  const updateStage = (stageName: string, updates: Partial<StageStatus>) => {
    setStages(prev => ({
      ...prev,
      [stageName]: { ...prev[stageName], ...updates }
    }));
  };

  // Stage 1: Validate user and new role
  const handleValidate = async () => {
    if (!selectedUserId || !newRoleId) {
      alert('Please select both user and new role');
      return;
    }

    updateStage('validate', { loading: true, error: undefined });

    try {
      // Check user exists and get current state
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, role_id')
        .eq('id', selectedUserId)
        .single();

      if (userError || !user) {
        throw new Error('User not found');
      }

      // Check new role exists
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', newRoleId)
        .single();

      if (roleError || !role) {
        throw new Error('New role not found');
      }

      // Get current assignment counts
      const { count: currentAssignments } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);

      // Get expected assignments for new role
      const { count: newRoleAssignments } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', newRoleId);

      const result = {
        user,
        currentAssignments,
        newRoleAssignments,
        willChange: currentAssignments !== newRoleAssignments
      };

      updateStage('validate', { 
        completed: true, 
        loading: false, 
        result 
      });

    } catch (error) {
      updateStage('validate', { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Validation failed' 
      });
    }
  };

  // Stage 2: Backup current assignments
  const handleBackup = async () => {
    if (!stages.validate.completed) {
      alert('Please complete validation first');
      return;
    }

    updateStage('backup', { loading: true, error: undefined });

    try {
      const user = stages.validate.result.user;

      // Get all current assignments
      const { data: currentAssignments, error } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', user.auth_id);

      if (error) throw error;

      // Store backup in a backup table or local storage
      const backup = {
        userId: user.id,
        authId: user.auth_id,
        oldRoleId: user.role_id,
        newRoleId,
        assignments: currentAssignments,
        backedUpAt: new Date().toISOString()
      };

      // Save backup to audit_log
      await supabase
        .from('audit_log')
        .insert({
          table_name: 'user_assignments',
          operation: 'role_change_backup',
          user_id: user.id,
          old_values: backup,
          timestamp: new Date().toISOString()
        });

      updateStage('backup', { 
        completed: true, 
        loading: false, 
        result: { backupCount: currentAssignments?.length || 0 }
      });

    } catch (error) {
      updateStage('backup', { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Backup failed' 
      });
    }
  };

  // Stage 3: Change user role
  const handleChangeRole = async () => {
    if (!stages.backup.completed) {
      alert('Please complete backup first');
      return;
    }

    updateStage('changeRole', { loading: true, error: undefined });

    try {
      const user = stages.validate.result.user;

      const { error } = await supabase
        .from('users')
        .update({ role_id: newRoleId })
        .eq('id', user.id);

      if (error) throw error;

      updateStage('changeRole', { 
        completed: true, 
        loading: false, 
        result: { oldRoleId: user.role_id, newRoleId }
      });

    } catch (error) {
      updateStage('changeRole', { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Role change failed' 
      });
    }
  };

  // Stage 4: Sync assignments (the critical step)
  const handleSyncAssignments = async () => {
    if (!stages.changeRole.completed) {
      alert('Please complete role change first');
      return;
    }

    updateStage('syncAssignments', { loading: true, error: undefined });

    try {
      const user = stages.validate.result.user;

      // Step 1: Delete ALL current assignments
      const { error: deleteError } = await supabase
        .from('user_assignments')
        .delete()
        .eq('auth_id', user.auth_id);

      if (deleteError) throw deleteError;

      // Step 2: Get new role assignments
      const { data: roleAssignments, error: roleError } = await supabase
        .from('role_assignments')
        .select('module_id, document_id, type')
        .eq('role_id', newRoleId);

      if (roleError) throw roleError;

      // Step 3: Insert new assignments
      if (roleAssignments && roleAssignments.length > 0) {
        const newAssignments = roleAssignments.map(ra => ({
          auth_id: user.auth_id,
          item_id: ra.document_id || ra.module_id,
          item_type: ra.type,
          assigned_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('user_assignments')
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      updateStage('syncAssignments', { 
        completed: true, 
        loading: false, 
        result: { 
          assignmentsDeleted: 'all',
          assignmentsAdded: roleAssignments?.length || 0
        }
      });

    } catch (error) {
      updateStage('syncAssignments', { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Assignment sync failed' 
      });
    }
  };

  // Stage 5: Verify final state
  const handleVerify = async () => {
    if (!stages.syncAssignments.completed) {
      alert('Please complete assignment sync first');
      return;
    }

    updateStage('verify', { loading: true, error: undefined });

    try {
      const user = stages.validate.result.user;

      // Get final assignment count
      const { count: finalAssignments } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);

      // Get expected count for new role
      const { count: expectedAssignments } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', newRoleId);

      const isCorrect = finalAssignments === expectedAssignments;

      // Log completion
      await supabase
        .from('audit_log')
        .insert({
          table_name: 'user_assignments',
          operation: 'staged_role_change_complete',
          user_id: user.id,
          new_values: {
            finalAssignments,
            expectedAssignments,
            success: isCorrect,
            completedAt: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        });

      updateStage('verify', { 
        completed: true, 
        loading: false, 
        result: { 
          finalAssignments,
          expectedAssignments,
          success: isCorrect
        }
      });

    } catch (error) {
      updateStage('verify', { 
        loading: false, 
        error: error instanceof Error ? error.message : 'Verification failed' 
      });
    }
  };

  const resetProcess = () => {
    setStages({
      validate: { completed: false, loading: false },
      backup: { completed: false, loading: false },
      changeRole: { completed: false, loading: false },
      syncAssignments: { completed: false, loading: false },
      verify: { completed: false, loading: false }
    });
    setSelectedUserId('');
    setNewRoleId('');
  };

  const StageButton = ({ 
    stageName, 
    title, 
    description, 
    onClick, 
    disabled 
  }: {
    stageName: string;
    title: string;
    description: string;
    onClick: () => void;
    disabled?: boolean;
  }) => {
    const stage = stages[stageName];
    
    return (
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            {stage.completed && <span className="text-green-500">✅</span>}
            {stage.loading && <span className="text-blue-500">🔄</span>}
            {stage.error && <span className="text-red-500">❌</span>}
          </div>
        </div>
        
        <p className="text-gray-600 mb-3">{description}</p>
        
        {stage.result && (
          <div className="bg-gray-100 p-2 rounded mb-3 text-sm">
            <pre>{JSON.stringify(stage.result, null, 2)}</pre>
          </div>
        )}
        
        {stage.error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-3 text-sm">
            Error: {stage.error}
          </div>
        )}
        
        <button
          onClick={onClick}
          disabled={disabled || stage.loading || stage.completed}
          className={`px-4 py-2 rounded font-medium ${
            disabled || stage.loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : stage.completed
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {stage.loading ? 'Processing...' : stage.completed ? 'Completed' : `Execute ${title}`}
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Staged Role Change Manager</h1>
      <p className="text-gray-600 mb-8">
        This process ensures users don't carry legacy assignments when changing roles. 
        Each stage must be completed in order.
      </p>

      {/* Input Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Setup</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">User ID</label>
            <input
              type="text"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Role ID</label>
            <input
              type="text"
              value={newRoleId}
              onChange={(e) => setNewRoleId(e.target.value)}
              placeholder="Enter new role ID"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Staged Process */}
      <div className="space-y-4">
        <StageButton
          stageName="validate"
          title="Stage 1: Validate"
          description="Verify user exists and check current vs future assignment counts"
          onClick={handleValidate}
        />

        <StageButton
          stageName="backup"
          title="Stage 2: Backup"
          description="Create backup of current assignments before making changes"
          onClick={handleBackup}
          disabled={!stages.validate.completed}
        />

        <StageButton
          stageName="changeRole"
          title="Stage 3: Change Role"
          description="Update the user's role_id in the database"
          onClick={handleChangeRole}
          disabled={!stages.backup.completed}
        />

        <StageButton
          stageName="syncAssignments"
          title="Stage 4: Sync Assignments"
          description="🚨 CRITICAL: Delete all old assignments and add new ones for the role"
          onClick={handleSyncAssignments}
          disabled={!stages.changeRole.completed}
        />

        <StageButton
          stageName="verify"
          title="Stage 5: Verify"
          description="Confirm the user has exactly the right assignments for their new role"
          onClick={handleVerify}
          disabled={!stages.syncAssignments.completed}
        />
      </div>

      {/* Reset Button */}
      <div className="mt-8 pt-4 border-t">
        <button
          onClick={resetProcess}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset Process
        </button>
      </div>

      {/* Final Status */}
      {stages.verify.completed && (
        <div className={`mt-6 p-4 rounded-lg ${
          stages.verify.result?.success 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <h3 className="font-semibold">
            {stages.verify.result?.success ? '🎉 Success!' : '❌ Issue Detected'}
          </h3>
          <p>
            User has {stages.verify.result?.finalAssignments} assignments, 
            expected {stages.verify.result?.expectedAssignments}
          </p>
        </div>
      )}
    </div>
  );
}
