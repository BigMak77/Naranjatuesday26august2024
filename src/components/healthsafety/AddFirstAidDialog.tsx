"use client";

import React, { useState, useEffect } from "react";
import { FiHeart, FiUser, FiCheck, FiUpload } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { supabase } from "@/lib/supabase-client";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  employee_number: string;
  auth_id: string;
  department_name?: string;
}

interface AddFirstAidDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddFirstAidDialog({ open, onClose, onAdded }: AddFirstAidDialogProps) {
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Stage 2 & 3 data
  const [trainingComplete, setTrainingComplete] = useState(false);
  const [trainingDate, setTrainingDate] = useState("");
  const [certificate, setCertificate] = useState<File | null>(null);
  
  const trainingModuleName = "Basic First Aid Training & Certification";

  // Reset dialog when opening/closing
  useEffect(() => {
    if (open) {
      setStage(1);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedUser(null);
      setTrainingComplete(false);
      setTrainingDate("");
      setCertificate(null);
      setError("");
    }
  }, [open]);

  // Search users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // First get users matching the search
        const { data: users, error: userError } = await supabase
          .from("users")
          .select("id, first_name, last_name, employee_number, auth_id, department_id")
          .eq("is_archived", false)
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,employee_number.ilike.%${searchQuery}%`)
          .limit(20);

        if (userError) throw userError;

        // Get department names for the users
        const departmentIds = [...new Set((users || []).map(u => u.department_id).filter(Boolean))];
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

        // Get existing first aid assignments
        const FIRST_AID_MODULE_ID = "f1236b6b-ee01-4e68-9082-e2380b0fa600";
        const authIds = users?.map(u => u.auth_id).filter(Boolean) || [];
        const { data: assignments, error: assignmentError } = await supabase
          .from("user_assignments")
          .select("auth_id")
          .eq("item_type", "module")
          .eq("item_id", FIRST_AID_MODULE_ID)
          .in("auth_id", authIds);

        if (assignmentError) throw assignmentError;

        const assignedAuthIds = new Set(assignments?.map(a => a.auth_id) || []);

        // Filter out users who already have first aid assignments
        const availableUsers = (users || [])
          .filter(user => user.auth_id && !assignedAuthIds.has(user.auth_id))
          .map(user => ({
            ...user,
            department_name: departmentMap.get(user.department_id) || "No Department"
          }))
          .slice(0, 10);

        setSearchResults(availableUsers);
      } catch (err: any) {
        setError(err.message || "Failed to search users");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setStage(2);
  };

  const handleStage2Continue = () => {
    if (!trainingComplete) {
      setError("Please confirm that training is complete");
      return;
    }
    if (!trainingDate) {
      setError("Please provide the training date");
      return;
    }
    setError("");
    setStage(3);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError("");

    try {
      // First, get the user's auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", selectedUser.id)
        .single();

      if (userError) throw userError;
      if (!userData?.auth_id) {
        throw new Error("User does not have an auth_id");
      }

      // Create user assignment for first aid module
      const FIRST_AID_MODULE_ID = "f1236b6b-ee01-4e68-9082-e2380b0fa600";
      const assignmentData = {
        auth_id: userData.auth_id,
        item_id: FIRST_AID_MODULE_ID,
        item_type: "module" as const
      };

      const { error: assignmentError } = await supabase
        .from("user_assignments")
        .upsert([{
          ...assignmentData,
          assigned_at: new Date().toISOString(), // When the assignment was made
          completed_at: new Date().toISOString() // Mark as completed when designated
        }], { 
          onConflict: "auth_id,item_id,item_type",
          ignoreDuplicates: false // Allow updates to existing first aid assignments
        });

      if (assignmentError) throw assignmentError;

      // Note: Training date and certificate information would need to be stored 
      // in a separate training_records table if detailed tracking is required
      // For now, the module assignment in user_assignments table indicates qualification

      onAdded?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add first aid designation");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCertificate(file);
    }
  };

  return (
    <OverlayDialog open={open} onClose={onClose}>
      <div style={{ minWidth: 400, maxWidth: 600, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <FiHeart className="neon-icon" style={{ color: "#ef4444" }} />
          <h2 className="neon-dialog-title" style={{ margin: 0 }}>
            Add First Aid Designation
          </h2>
        </div>

        {/* Stage Indicator */}
        <div style={{ display: "flex", marginBottom: 24, gap: 8 }}>
          {[1, 2, 3].map(stageNum => (
            <div
              key={stageNum}
              style={{
                flex: 1,
                height: 4,
                backgroundColor: stage >= stageNum ? "#22c55e" : "#374151",
                borderRadius: 2
              }}
            />
          ))}
        </div>

        {error && (
          <div className="neon-error" style={{ marginBottom: 16, padding: 12, backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6 }}>
            <p style={{ color: "#ef4444", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Stage 1: User Search */}
        {stage === 1 && (
          <div>
            <h3 className="neon-section-title">
              <FiUser /> Select User
            </h3>
            <p className="neon-label" style={{ marginBottom: 16 }}>
              Search for the employee you want to designate as first aid qualified.
            </p>
            
            <label className="neon-label" htmlFor="userSearch">Search Users</label>
            <input
              id="userSearch"
              className="neon-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type name or email..."
              style={{ marginBottom: 16 }}
            />

            {searchLoading && <p className="neon-info">Searching...</p>}

            {searchResults.length > 0 && (
              <div style={{ 
                maxHeight: 200, 
                overflowY: 'auto', 
                border: '1px solid #374151', 
                borderRadius: 6, 
                backgroundColor: '#1f2937' 
              }}>
                {searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    style={{
                      padding: 12,
                      borderBottom: '1px solid #374151',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#374151';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Employee #{user.employee_number} • {user.department_name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
              <p className="neon-muted">No eligible users found.</p>
            )}
          </div>
        )}

        {/* Stage 2: Training Confirmation */}
        {stage === 2 && selectedUser && (
          <div>
            <h3 className="neon-section-title">
              <FiCheck /> Confirm Training
            </h3>
            <p className="neon-label" style={{ marginBottom: 16 }}>
              Selected User: <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>
            </p>

            <div style={{ 
              padding: 16, 
              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.3)', 
              borderRadius: 6,
              marginBottom: 16
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>Training Module</h4>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{trainingModuleName}</p>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', marginBottom: 16, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={trainingComplete}
                onChange={(e) => setTrainingComplete(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              <span className="neon-label">
                I confirm that this user has completed the required training
              </span>
            </label>

            <label className="neon-label" htmlFor="trainingDate">Training Completion Date</label>
            <input
              id="trainingDate"
              className="neon-input"
              type="date"
              value={trainingDate}
              onChange={(e) => setTrainingDate(e.target.value)}
              style={{ marginBottom: 16 }}
              required
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <NeonIconButton
                variant="cancel"
                title="Back"
                onClick={() => setStage(1)}
              />
              <NeonIconButton
                variant="next"
                title="Continue"
                onClick={handleStage2Continue}
              />
            </div>
          </div>
        )}

        {/* Stage 3: Certificate Upload */}
        {stage === 3 && selectedUser && (
          <div>
            <h3 className="neon-section-title">
              <FiUpload /> Upload Certificate
            </h3>
            <p className="neon-label" style={{ marginBottom: 16 }}>
              Final step: Upload the training certificate (optional but recommended).
            </p>

            <div style={{ marginBottom: 16 }}>
              <label className="neon-label" htmlFor="certificate">Training Certificate</label>
              <input
                id="certificate"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="neon-input"
                style={{ padding: 8 }}
              />
              {certificate && (
                <p className="neon-info" style={{ marginTop: 8 }}>
                  Selected: {certificate.name}
                </p>
              )}
            </div>

            <div style={{ 
              padding: 16, 
              backgroundColor: 'rgba(34, 197, 94, 0.1)', 
              border: '1px solid rgba(34, 197, 94, 0.3)', 
              borderRadius: 6,
              marginBottom: 16
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#22c55e' }}>Summary</h4>
              <p style={{ margin: '0 0 4px 0' }}><strong>User:</strong> {selectedUser.first_name} {selectedUser.last_name}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Training:</strong> {trainingModuleName}</p>
              <p style={{ margin: '0 0 4px 0' }}><strong>Date:</strong> {trainingDate}</p>
              <p style={{ margin: '0', fontSize: '0.875rem', opacity: 0.8 }}>
                Note: User will receive completed module assignment with today's completion date.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <NeonIconButton
                variant="cancel"
                title="Back"
                onClick={() => setStage(2)}
                disabled={loading}
              />
              <NeonIconButton
                variant="submit"
                icon={<FiCheck />}
                title={loading ? "Processing..." : "Complete"}
                onClick={handleSubmit}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>
    </OverlayDialog>
  );
}
