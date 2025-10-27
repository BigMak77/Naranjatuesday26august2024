"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiClock, FiAlertTriangle, FiCheck, FiRefreshCw, FiX } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";
import SignaturePad from "react-signature-canvas";
import ContentHeader from "@/components/ui/ContentHeader";

interface FollowUpAssignment {
  id: string;
  auth_id: string;
  item_id: string;
  follow_up_due_date: string;
  follow_up_completed_at: string | null;
  completed_at: string;
  user_name: string;
  user_email: string;
  module_name: string;
  review_period: string;
  days_overdue: number;
}

export default function TrainingAssessment() {
  const [assignments, setAssignments] = useState<FollowUpAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'due' | 'overdue' | 'completed'>('all');

  // Sign-off dialog state
  const [showSignOffDialog, setShowSignOffDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<FollowUpAssignment | null>(null);
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState<'satisfactory' | 'needs-improvement'>('satisfactory');
  const [signingOff, setSigningOff] = useState(false);

  const fetchFollowUpAssignments = async () => {
    setLoading(true);
    setError(null);

    console.log('🔍 Fetching follow-up assessments...');

    try {
      // Query user_assignments with follow-up requirements
      const { data, error } = await supabase
        .from('user_assignments')
        .select(`
          id,
          auth_id,
          item_id,
          follow_up_due_date,
          follow_up_completed_at,
          completed_at,
          follow_up_required
        `)
        .eq('follow_up_required', true)
        .not('follow_up_due_date', 'is', null)
        .eq('item_type', 'module')
        .order('follow_up_due_date', { ascending: true });

      console.log('📊 Query result:', { data, error });

      if (error) {
        console.error('❌ Query error:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ No follow-up assignments found');
        setAssignments([]);
        setLoading(false);
        return;
      }

      console.log(`📋 Found ${data.length} assignments with follow-up required`);

      // Get unique auth_ids and item_ids
      const authIds = [...new Set(data.map(a => a.auth_id).filter(Boolean))];
      const moduleIds = [...new Set(data.map(a => a.item_id).filter(Boolean))];

      console.log('👥 Fetching user data for:', authIds.length, 'users');
      console.log('📚 Fetching module data for:', moduleIds.length, 'modules');

      // Fetch user data from users table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, email')
        .in('auth_id', authIds);

      if (usersError) {
        console.warn('Could not fetch users:', usersError);
      }

      console.log('👥 Users data:', usersData);

      // Fetch module data
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, name, review_period')
        .in('id', moduleIds);

      if (modulesError) {
        console.warn('Could not fetch modules:', modulesError);
      }

      console.log('📚 Modules data:', modulesData);

      // Create lookup maps
      const userMap = new Map();
      usersData?.forEach(user => {
        const displayName = [user.first_name, user.last_name]
          .filter(Boolean)
          .join(' ')
          .trim() || user.email || 'Unknown User';
        userMap.set(user.auth_id, {
          name: displayName,
          email: user.email || 'No email'
        });
      });

      const moduleMap = new Map();
      modulesData?.forEach(module => {
        moduleMap.set(module.id, {
          name: module.name,
          review_period: module.review_period
        });
      });

      // Process the assignments data
      const processedAssignments = data.map(assignment => {
        const user = userMap.get(assignment.auth_id) || {
          name: `User ${assignment.auth_id.slice(0, 8)}`,
          email: 'Unknown'
        };

        const module = moduleMap.get(assignment.item_id) || {
          name: 'Unknown Module',
          review_period: 'Unknown'
        };

        const dueDate = new Date(assignment.follow_up_due_date);
        const today = new Date();
        const diffTime = today.getTime() - dueDate.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: assignment.id,
          auth_id: assignment.auth_id,
          item_id: assignment.item_id,
          follow_up_due_date: assignment.follow_up_due_date,
          follow_up_completed_at: assignment.follow_up_completed_at,
          completed_at: assignment.completed_at,
          user_name: user.name,
          user_email: user.email,
          module_name: module.name,
          review_period: module.review_period,
          days_overdue: daysOverdue
        };
      });

      console.log('✅ Processed assignments:', processedAssignments);
      setAssignments(processedAssignments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch follow-up assessments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUpAssignments();
  }, []);

  const openSignOffDialog = (assignment: FollowUpAssignment) => {
    setSelectedAssignment(assignment);
    setSignature("");
    setNotes("");
    setOutcome('satisfactory');
    setShowSignOffDialog(true);
  };

  const closeSignOffDialog = () => {
    setShowSignOffDialog(false);
    setSelectedAssignment(null);
    setSignature("");
    setNotes("");
    setOutcome('satisfactory');
  };

  const handleSignOff = async () => {
    if (!selectedAssignment) return;

    if (!signature.trim()) {
      setError("Please provide your signature to sign off this assessment");
      return;
    }

    setSigningOff(true);
    setError(null);

    console.log('=== Signing off follow-up assessment ===');
    console.log('Assignment ID:', selectedAssignment.id);
    console.log('User:', selectedAssignment.user_name);
    console.log('Module:', selectedAssignment.module_name);
    console.log('Outcome:', outcome);
    console.log('Notes:', notes);

    try {
      const completedAt = new Date().toISOString();

      // Update the assignment with completion info
      const { error: updateError } = await supabase
        .from('user_assignments')
        .update({
          follow_up_completed_at: completedAt
        })
        .eq('id', selectedAssignment.id);

      if (updateError) throw updateError;

      console.log('✅ Follow-up assessment signed off successfully');

      // Close dialog and refresh data
      closeSignOffDialog();
      await fetchFollowUpAssignments();
    } catch (err) {
      console.error('❌ Error signing off assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign off assessment');
    } finally {
      setSigningOff(false);
    }
  };

  const sigPadRef = useRef<SignaturePad>(null);

  const clearSignature = () => {
    console.log('🗑️ Clearing signature');
    sigPadRef.current?.clear();
    setSignature("");
  };

  const handleSignatureEnd = () => {
    console.log('✍️ Signature drawing ended');
    if (sigPadRef.current) {
      const isEmpty = sigPadRef.current.isEmpty();
      console.log('📝 Signature pad isEmpty:', isEmpty);

      if (!isEmpty) {
        const dataUrl = sigPadRef.current.toDataURL();
        console.log('✅ Signature captured, length:', dataUrl.length);
        setSignature(dataUrl);
      } else {
        console.log('⚠️ Signature pad is empty, not capturing');
      }
    } else {
      console.log('❌ Signature pad ref is null');
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    switch (filter) {
      case 'due':
        return !assignment.follow_up_completed_at && assignment.days_overdue <= 0;
      case 'overdue':
        return !assignment.follow_up_completed_at && assignment.days_overdue > 0;
      case 'completed':
        return assignment.follow_up_completed_at;
      default:
        return true;
    }
  });

  const getStatusIcon = (assignment: FollowUpAssignment) => {
    if (assignment.follow_up_completed_at) {
      return <FiCheck className="text-green-400" size={18} />;
    } else if (assignment.days_overdue > 0) {
      return <FiAlertTriangle className="text-red-400" size={18} />;
    } else {
      return <FiClock className="text-yellow-400" size={18} />;
    }
  };

  const getStatusText = (assignment: FollowUpAssignment) => {
    if (assignment.follow_up_completed_at) {
      return 'Completed';
    } else if (assignment.days_overdue > 0) {
      return `${assignment.days_overdue} days overdue`;
    } else if (assignment.days_overdue === 0) {
      return 'Due today';
    } else {
      return `Due in ${Math.abs(assignment.days_overdue)} days`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="training-assessment">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <FiRefreshCw className="animate-spin" size={24} />
          <p style={{ marginTop: '12px' }}>Loading follow-up assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContentHeader
        title="Training Follow-up Assessments"
        description="Manage and track follow-up assessments for completed training modules"
      />

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgb(239, 68, 68)',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          color: 'rgb(239, 68, 68)'
        }}>
          {error}
        </div>
      )}

      {/* Filter buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'all', label: 'All', count: assignments.length },
          { key: 'due', label: 'Due Soon', count: assignments.filter(a => !a.follow_up_completed_at && a.days_overdue <= 0).length },
          { key: 'overdue', label: 'Overdue', count: assignments.filter(a => !a.follow_up_completed_at && a.days_overdue > 0).length },
          { key: 'completed', label: 'Completed', count: assignments.filter(a => a.follow_up_completed_at).length }
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            style={{
              background: filter === key ? 'var(--accent)' : 'transparent',
              color: filter === key ? 'var(--bg)' : 'var(--text)',
              border: filter === key ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {label}
            <span style={{
              background: filter === key ? 'rgba(0,0,0,0.2)' : 'var(--accent)',
              color: filter === key ? 'var(--bg)' : 'var(--bg)',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Refresh button */}
      <div style={{ marginBottom: '20px' }}>
        <NeonIconButton
          variant="add"
          icon={<FiRefreshCw size={16} />}
          title="Refresh Data"
          onClick={fetchFollowUpAssignments}
        />
      </div>

      {/* Assignments list */}
      {filteredAssignments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border)',
          borderRadius: '8px'
        }}>
          <FiClock size={32} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <p>No follow-up assessments found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                {getStatusIcon(assignment)}

                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: 'var(--text)',
                    marginBottom: '4px'
                  }}>
                    {assignment.user_name}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}>
                    {assignment.user_email}
                  </div>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--accent)',
                    fontWeight: 500
                  }}>
                    Module: {assignment.module_name}
                  </div>
                </div>

                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '2px'
                  }}>
                    Due: {formatDate(assignment.follow_up_due_date)}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    color: assignment.follow_up_completed_at
                      ? 'var(--success, #10b981)'
                      : assignment.days_overdue > 0
                        ? 'var(--error, #ef4444)'
                        : 'var(--warning, #f59e0b)'
                  }}>
                    {getStatusText(assignment)}
                  </div>
                  {assignment.follow_up_completed_at && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginTop: '2px'
                    }}>
                      Completed: {formatDate(assignment.follow_up_completed_at)}
                    </div>
                  )}
                </div>
              </div>

              {!assignment.follow_up_completed_at && (
                <NeonIconButton
                  variant="add"
                  icon={<FiCheck size={16} />}
                  title="Sign Off Assessment"
                  onClick={() => openSignOffDialog(assignment)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {assignments.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: 'var(--accent)',
            fontSize: '0.95rem',
            fontWeight: 600,
            marginBottom: '12px'
          }}>
            Summary
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            fontSize: '0.85rem'
          }}>
            <div>
              <strong style={{ color: 'var(--text)' }}>Total: </strong>
              <span style={{ color: 'var(--text-secondary)' }}>{assignments.length}</span>
            </div>
            <div>
              <strong style={{ color: 'var(--warning, #f59e0b)' }}>Due Soon: </strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {assignments.filter(a => !a.follow_up_completed_at && a.days_overdue <= 0).length}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--error, #ef4444)' }}>Overdue: </strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {assignments.filter(a => !a.follow_up_completed_at && a.days_overdue > 0).length}
              </span>
            </div>
            <div>
              <strong style={{ color: 'var(--success, #10b981)' }}>Completed: </strong>
              <span style={{ color: 'var(--text-secondary)' }}>
                {assignments.filter(a => a.follow_up_completed_at).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sign-off Dialog */}
      {showSignOffDialog && selectedAssignment && (
        <OverlayDialog
          open={showSignOffDialog}
          onClose={closeSignOffDialog}
          width={1100}
        >
          <div style={{ padding: '20px' }}>
            {/* Dialog Title */}
            <h2 style={{
              color: 'var(--accent)',
              fontSize: '1.5rem',
              fontWeight: 600,
              marginBottom: '24px',
              borderBottom: '2px solid var(--border)',
              paddingBottom: '12px'
            }}>
              Sign Off Follow-Up Assessment
            </h2>

            {/* Assignment Details */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '8px'
            }}>
              <h3 style={{
                color: 'var(--accent)',
                fontSize: '1rem',
                fontWeight: 600,
                marginBottom: '12px'
              }}>
                Assessment Details
              </h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                <div><strong>Trainee:</strong> {selectedAssignment.user_name}</div>
                <div><strong>Module:</strong> {selectedAssignment.module_name}</div>
                <div><strong>Completed:</strong> {formatDate(selectedAssignment.completed_at)}</div>
                <div><strong>Due:</strong> {formatDate(selectedAssignment.follow_up_due_date)}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    color: selectedAssignment.days_overdue > 0 ? 'var(--error, #ef4444)' : 'var(--warning, #f59e0b)'
                  }}>
                    {getStatusText(selectedAssignment)}
                  </span>
                </div>
              </div>
            </div>

            {/* Outcome Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'var(--text)',
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                Assessment Outcome
              </label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    border: `2px solid ${outcome === 'satisfactory' ? 'var(--success, #10b981)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    background: outcome === 'satisfactory' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onClick={() => setOutcome('satisfactory')}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <NeonIconButton
                        variant={outcome === 'satisfactory' ? 'save' : 'add'}
                        icon={<FiCheck size={20} />}
                        title=""
                        onClick={(e) => {
                          e.stopPropagation();
                          setOutcome('satisfactory');
                        }}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                    <div style={{
                      color: outcome === 'satisfactory' ? 'var(--success, #10b981)' : 'var(--text)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>
                      Satisfactory
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      marginTop: '4px'
                    }}>
                      Trainee demonstrates competence
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    border: `2px solid ${outcome === 'needs-improvement' ? 'var(--warning, #f59e0b)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    background: outcome === 'needs-improvement' ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onClick={() => setOutcome('needs-improvement')}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <NeonIconButton
                        variant={outcome === 'needs-improvement' ? 'edit' : 'add'}
                        icon={<FiAlertTriangle size={20} />}
                        title=""
                        onClick={(e) => {
                          e.stopPropagation();
                          setOutcome('needs-improvement');
                        }}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          pointerEvents: 'none'
                        }}
                      />
                    </div>
                    <div style={{
                      color: outcome === 'needs-improvement' ? 'var(--warning, #f59e0b)' : 'var(--text)',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}>
                      Needs Improvement
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      marginTop: '4px'
                    }}>
                      Additional training required
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'var(--text)',
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                Assessment Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any observations or recommendations..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--input-bg, var(--bg))',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Signature */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: 'var(--text)',
                fontWeight: 500,
                marginBottom: '8px'
              }}>
                Trainer Signature *
              </label>
              <div style={{
                border: '2px solid var(--border)',
                borderRadius: '8px',
                background: 'white',
                position: 'relative',
                width: '100%',
                height: '180px'
              }}>
                <SignaturePad
                  ref={sigPadRef}
                  onEnd={handleSignatureEnd}
                  penColor="black"
                  backgroundColor="white"
                  canvasProps={{
                    width: 1000,
                    height: 180,
                    className: 'signature-canvas',
                    style: {
                      width: '100%',
                      height: '100%',
                      borderRadius: '8px',
                      touchAction: 'none'
                    }
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  zIndex: 10
                }}>
                  <NeonIconButton
                    variant="delete"
                    icon={<FiX size={14} />}
                    title="Clear"
                    onClick={clearSignature}
                  />
                </div>
              </div>
              <p style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: '8px'
              }}>
                Draw your signature above to confirm the assessment
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgb(239, 68, 68)',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '20px',
                color: 'rgb(239, 68, 68)',
                fontSize: '0.9rem'
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <NeonIconButton
                variant="delete"
                icon={<FiX size={16} />}
                title="Cancel"
                onClick={closeSignOffDialog}
                disabled={signingOff}
              />
              <NeonIconButton
                variant={signature.trim() ? 'save' : 'add'}
                icon={signingOff ? <FiRefreshCw className="animate-spin" size={16} /> : <FiCheck size={16} />}
                title={signingOff ? 'Signing Off...' : 'Sign Off Assessment'}
                onClick={handleSignOff}
                disabled={signingOff || !signature.trim()}
              />
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}