"use client";

import React, { useState, useEffect } from "react";
import { FiUser, FiCheck, FiClock, FiX } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";
import { supabase } from "@/lib/supabase-client";

interface FirstAider {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  department_name?: string;
  auth_id: string;
  training_completed: boolean;
  assignment_created_at?: string;
}

interface ViewFirstAidersDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function ViewFirstAidersDialog({ open, onClose }: ViewFirstAidersDialogProps) {
  const [firstAiders, setFirstAiders] = useState<FirstAider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const FIRST_AID_MODULE_ID = "f1236b6b-ee01-4e68-9082-e2380b0fa600";

  useEffect(() => {
    if (open) {
      fetchFirstAiders();
    }
  }, [open]);

  const fetchFirstAiders = async () => {
    setLoading(true);
    setError("");

    try {
      // Get all users marked as first aid in users table (legacy approach)
      const { data: usersWithFirstAid, error: usersError } = await supabase
        .from("users")
        .select(`
          id, 
          first_name, 
          last_name, 
          employee_number, 
          auth_id,
          is_first_aid,
          department_id
        `)
        .eq("is_archived", false)
        .eq("is_first_aid", true)
        .order("first_name");

      if (usersError) throw usersError;

      // Get department names for the users
      const departmentIds = [...new Set((usersWithFirstAid || []).map(u => u.department_id).filter(Boolean))];
      let departmentMap = new Map<string, string>();
      
      if (departmentIds.length > 0) {
        const { data: departments, error: deptError } = await supabase
          .from("departments")
          .select("id, name")
          .in("id", departmentIds);
        
        if (!deptError && departments) {
          departments.forEach(dept => {
            departmentMap.set(dept.id, dept.name);
          });
        }
      }

      // Get all users with first aid module assignments (new approach)
      const { data: moduleAssignments, error: assignmentsError } = await supabase
        .from("user_assignments")
        .select("auth_id, assigned_at, completed_at")
        .eq("item_type", "module")
        .eq("item_id", FIRST_AID_MODULE_ID);

      if (assignmentsError) throw assignmentsError;

      // Combine both sources and create a unified list
      const allFirstAiders = new Map<string, FirstAider>();

      // Add users from legacy is_first_aid flag
      (usersWithFirstAid || []).forEach(user => {
        if (user.auth_id) {
          allFirstAiders.set(user.auth_id, {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            employee_number: user.employee_number,
            department_name: departmentMap.get(user.department_id) || "No Department",
            auth_id: user.auth_id,
            training_completed: false, // Will be updated if they have assignments
            assignment_created_at: undefined
          });
        }
      });

      // Update training status for users who have module assignments
      const assignmentMap = new Map();
      (moduleAssignments || []).forEach(assignment => {
        if (assignment.auth_id) {
          assignmentMap.set(assignment.auth_id, {
            training_completed: !!assignment.completed_at,
            assignment_created_at: assignment.assigned_at
          });
        }
      });

      // Update existing first aiders with training status from assignments
      allFirstAiders.forEach((firstAider, authId) => {
        const assignment = assignmentMap.get(authId);
        if (assignment) {
          firstAider.training_completed = assignment.training_completed;
          firstAider.assignment_created_at = assignment.assignment_created_at;
        }
      });

      const firstAidersList = Array.from(allFirstAiders.values()).sort((a, b) => 
        a.first_name.localeCompare(b.first_name)
      );

      setFirstAiders(firstAidersList);
    } catch (err: any) {
      setError(err.message || "Failed to fetch first aiders");
    } finally {
      setLoading(false);
    }
  };

  const getTrainingStatus = (firstAider: FirstAider) => {
    if (firstAider.training_completed) {
      return {
        status: "completed",
        icon: <FiCheck style={{ color: "#22c55e" }} />,
        text: "Training Completed",
        date: firstAider.assignment_created_at 
          ? `Completed: ${new Date(firstAider.assignment_created_at).toLocaleDateString()}`
          : "Completed (date not recorded)"
      };
    } else if (firstAider.assignment_created_at) {
      return {
        status: "assigned",
        icon: <FiClock style={{ color: "#f59e0b" }} />,
        text: "Training In Progress",
        date: `Assigned: ${new Date(firstAider.assignment_created_at).toLocaleDateString()}`
      };
    } else {
      return {
        status: "not_started",
        icon: <FiX style={{ color: "#ef4444" }} />,
        text: "Training Not Started",
        date: "No training assignment found"
      };
    }
  };

  return (
    <OverlayDialog open={open} onClose={onClose}>
      <>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <FiUser className="neon-icon" style={{ color: "#ef4444", marginRight: 12 }} />
          <h2 className="neon-dialog-title" style={{ margin: 0 }}>
            Trained First Aiders
          </h2>
        </div>

        {error && (
          <div className="neon-error" style={{ marginBottom: 16, padding: 12, backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6 }}>
            <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
          </div>
        )}

        {loading ? (
          <p className="neon-loading">Loading first aiders...</p>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: 12,
                marginBottom: 16
              }}>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: '#22c55e', 
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {firstAiders.filter(fa => fa.training_completed).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Completed</div>
                </div>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: '#f59e0b', 
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {firstAiders.filter(fa => fa.assignment_created_at && !fa.training_completed).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>In Progress</div>
                </div>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: '#ef4444', 
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {firstAiders.filter(fa => !fa.assignment_created_at).length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Not Started</div>
                </div>
                <div style={{ 
                  padding: 12, 
                  backgroundColor: '#3b82f6', 
                  borderRadius: 6,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {firstAiders.length}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#ffffff' }}>Total</div>
                </div>
              </div>
            </div>

            {firstAiders.length === 0 ? (
              <p className="neon-muted">No first aiders found.</p>
            ) : (
              <div style={{
                maxHeight: 500,
                overflowY: 'scroll',
                border: '1px solid #374151',
                borderRadius: 6,
                backgroundColor: '#1f2937'
              }}>
                {firstAiders.map(firstAider => {
                  const trainingStatus = getTrainingStatus(firstAider);
                  return (
                    <div
                      key={firstAider.id}
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #374151',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>
                          {firstAider.first_name} {firstAider.last_name} • #{firstAider.employee_number} • {firstAider.department_name}
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                        {trainingStatus.icon}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontWeight: 'bold', 
                            color: trainingStatus.status === 'completed' ? '#22c55e' :
                                   trainingStatus.status === 'assigned' ? '#f59e0b' : '#ef4444'
                          }}>
                            {trainingStatus.text}
                          </div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                            {trainingStatus.date}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ 
              marginTop: 16,
              padding: 12,
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 6,
              fontSize: '0.875rem'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>Legend</h4>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiCheck style={{ color: "#22c55e" }} />
                  <span>Training Completed (has completed_at date)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiClock style={{ color: "#f59e0b" }} />
                  <span>Training In Progress (assigned but not completed)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiX style={{ color: "#ef4444" }} />
                  <span>Training Not Started (no assignment found)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    </OverlayDialog>
  );
}
