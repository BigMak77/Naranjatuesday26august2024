"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import {
  FiSend,
} from "react-icons/fi";
import SearchableDropdown from "@/components/SearchableDropdown";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SuccessModal from "@/components/ui/SuccessModal";
import OverlayDialog from "@/components/ui/OverlayDialog";
import DualPaneSelector from "@/components/ui/DualPaneSelector";

type UUID = string;

interface Module {
  id: UUID;
  name: string;
}
interface Department {
  id: UUID | null;
  name: string;
}
interface UserRow {
  id: UUID | null; // app user id (pk)
  first_name?: string | null;
  last_name?: string | null;
  department_id: UUID | null;
  auth_id: UUID | null;
}
interface User {
  id: UUID | null;
  name: string;
  department_id: UUID | null;
  auth_id: UUID | null;
}

type Step = 1 | 2 | 3;

export default function AssignModuleWizard() {
  const [step, setStep] = useState<Step>(1);
  const [showDepartmentDialog, setShowDepartmentDialog] = useState(false);

  const [modules, setModules] = useState<Module[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedModule, setSelectedModule] = useState<UUID>("");
  const [selectedDeptIds, setSelectedDeptIds] = useState<UUID[]>([]);
  const [selectedUserAuthIds, setSelectedUserAuthIds] = useState<UUID[]>([]);

  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  // Success modal state
  const [showSuccess, setShowSuccess] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);
  const [alreadyAssignedCount, setAlreadyAssignedCount] = useState(0);
  const [successDetails, setSuccessDetails] = useState("");
  const [existingAssignments, setExistingAssignments] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setLoading(true);
      setFeedback("");
      const [
        { data: m, error: mErr },
        { data: d, error: dErr },
        { data: u, error: uErr },
      ] = await Promise.all([
        supabase
          .from("modules")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("departments")
          .select("id, name")
          .order("name", { ascending: true }),
        supabase
          .from("users")
          .select("id, first_name, last_name, department_id, auth_id")
          .order("last_name", { ascending: true }),
      ]);

      if (mErr || dErr || uErr) {
        setFeedback(
          [
            mErr ? `Modules error: ${mErr.message}` : "",
            dErr ? `Departments error: ${dErr.message}` : "",
            uErr ? `Users error: ${uErr.message}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        );
      }

      setModules((m ?? []) as Module[]);
      setDepartments((d ?? []) as Department[]);

      // Cook users, skipping any rows that lack an auth_id (can’t assign without it)
      const cooked: User[] = (u ?? [])
        .map((row: UserRow) => ({
          id: row.id ?? null,
          name:
            `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
            "(no name)",
          department_id: row.department_id ?? null,
          auth_id: row.auth_id ?? null,
        }))
        .filter((u) => !!u.auth_id); // keep only users with a valid auth_id

      setUsers(cooked);
      setLoading(false);
    })();
  }, []);

  // Check existing assignments when step 3 is entered or dependencies change
  useEffect(() => {
    if (step === 3) {
      checkExistingAssignments();
    }
  }, [step, selectedModule, selectedDeptIds, users]);

  // Step 3: users drawn from selected departments (with search)
  const filteredUsers: User[] = useMemo(() => {
    const pool = selectedDeptIds.length
      ? users.filter(
          (u) => !!u.department_id && selectedDeptIds.includes(u.department_id),
        )
      : [];
    const q = userSearch.trim().toLowerCase();
    return q ? pool.filter((u) => u.name.toLowerCase().includes(q)) : pool;
  }, [users, selectedDeptIds, userSearch]);

  const deptUserCount = useMemo(() => {
    if (!selectedDeptIds.length) return 0;
    return users.filter(
      (u) => u.department_id && selectedDeptIds.includes(u.department_id),
    ).length;
  }, [users, selectedDeptIds]);

  const canGoNextFrom1 = !!selectedModule;
  const canGoNextFrom2 = selectedDeptIds.length > 0;
  const canAssign = selectedUserAuthIds.length > 0 && !!selectedModule;

  // Check existing assignments for the selected module and department users
  const checkExistingAssignments = async () => {
    if (!selectedModule || selectedDeptIds.length === 0) {
      setExistingAssignments(new Set());
      return;
    }

    const departmentUsers = users.filter(
      (u) => !!u.department_id && selectedDeptIds.includes(u.department_id) && !!u.auth_id
    );

    if (departmentUsers.length === 0) {
      setExistingAssignments(new Set());
      return;
    }

    const userAuthIds = departmentUsers.map((u) => u.auth_id!);

    try {
      const { data: assignments, error } = await supabase
        .from("user_assignments")
        .select("auth_id")
        .eq("item_id", selectedModule)
        .eq("item_type", "module")
        .in("auth_id", userAuthIds);

      if (!error && assignments) {
        setExistingAssignments(new Set(assignments.map((a) => a.auth_id)));
      } else {
        setExistingAssignments(new Set());
      }
    } catch (err) {
      console.error("Error checking existing assignments:", err);
      setExistingAssignments(new Set());
    }
  };

  // Toggle helpers
  const toggleDept = (deptId: UUID | null) => {
    if (!deptId) return; // ignore departments without IDs
    setSelectedUserAuthIds([]); // reset selections when department changes
    setSelectedDeptIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  };

  const allVisibleAuthIds = useMemo(
    () => filteredUsers.map((u) => u.auth_id!).filter(Boolean),
    [filteredUsers],
  );

  const allChecked = useMemo(
    () =>
      allVisibleAuthIds.length > 0 &&
      allVisibleAuthIds.every((id) => selectedUserAuthIds.includes(id)),
    [allVisibleAuthIds, selectedUserAuthIds],
  );

  const toggleSelectAllVisible = () => {
    if (allChecked) {
      setSelectedUserAuthIds((prev) =>
        prev.filter((id) => !allVisibleAuthIds.includes(id)),
      );
    } else {
      setSelectedUserAuthIds((prev) =>
        Array.from(new Set([...prev, ...allVisibleAuthIds])),
      );
    }
  };

  const toggleUser = (authId: UUID | null) => {
    if (!authId) return;
    setSelectedUserAuthIds((prev) =>
      prev.includes(authId)
        ? prev.filter((id) => id !== authId)
        : [...prev, authId],
    );
  };

  // Assign action
  const handleAssign = async () => {
    setFeedback("");
    if (!canAssign) {
      setFeedback("Select at least one user.");
      return;
    }
    setAssigning(true);
    try {
      // Fetch the module to get follow-up settings
      const { data: moduleData, error: moduleError } = await supabase
        .from("modules")
        .select("requires_follow_up, review_period")
        .eq("id", selectedModule)
        .single();

      if (moduleError) {
        setFeedback(`Failed to fetch module data: ${moduleError.message}`);
        setAssigning(false);
        return;
      }

      const uniqueAuthIds = Array.from(
        new Set(selectedUserAuthIds.filter(Boolean)),
      );

      // Check for existing assignments
      const { data: existingAssignments, error: existingError } = await supabase
        .from("user_assignments")
        .select("auth_id")
        .eq("item_id", selectedModule)
        .eq("item_type", "module")
        .in("auth_id", uniqueAuthIds);

      if (existingError) {
        setFeedback(`Failed to check existing assignments: ${existingError.message}`);
        setAssigning(false);
        return;
      }

      const alreadyAssignedAuthIds = new Set(
        existingAssignments?.map((assignment) => assignment.auth_id) || []
      );

      // Filter out users who already have the module assigned
      const newAuthIds = uniqueAuthIds.filter(
        (authId) => !alreadyAssignedAuthIds.has(authId)
      );

      // Get user names for feedback
      const alreadyAssignedUsers = users
        .filter((u) => u.auth_id && alreadyAssignedAuthIds.has(u.auth_id))
        .map((u) => u.name);

      const newUsers = users
        .filter((u) => u.auth_id && newAuthIds.includes(u.auth_id))
        .map((u) => u.name);

      // If no new assignments to make
      if (newAuthIds.length === 0) {
        if (alreadyAssignedUsers.length > 0) {
          setFeedback(
            `All selected users already have this module assigned: ${alreadyAssignedUsers.join(", ")}`
          );
        } else {
          setFeedback("No valid users to assign.");
        }
        setAssigning(false);
        return;
      }

      // Create assignment rows for new users only
      const rows = newAuthIds.map((auth_id) => ({
        auth_id,
        item_id: selectedModule,
        item_type: "module" as const,
        follow_up_assessment_required: moduleData?.requires_follow_up || false,
      }));

      const { error } = await supabase
        .from("user_assignments")
        .upsert(rows, { onConflict: "auth_id,item_id,item_type" });

      if (error) {
        setFeedback(`Assignment failed: ${error.message}
If this persists, check Row Level Security policies on "user_assignments".`);
        return;
      }

      // Show success modal with detailed information
      setAssignedCount(rows.length);
      setAlreadyAssignedCount(alreadyAssignedUsers.length);
      setSuccessDetails(
        alreadyAssignedUsers.length > 0
          ? `${alreadyAssignedUsers.length} user(s) already had this module: ${alreadyAssignedUsers.join(", ")}`
          : ""
      );
      setShowSuccess(true);
      
      setFeedback("");
      
      // Reset selections
      setSelectedDeptIds([]);
      setSelectedUserAuthIds([]);
      setStep(1);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      setFeedback(`Unexpected error: ${errMsg}`);
    } finally {
      setAssigning(false);
    }
  };

  // Get module name for success message
  const moduleName = modules.find((m) => m.id === selectedModule)?.name ?? "Module";

  if (loading)
    return (
      <div className="user-manager-loading">
        Loading…
      </div>
    );

  return (
    <>
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Assignment Completed!"
        message={
          assignedCount > 0
            ? `Successfully assigned "${moduleName}" to ${assignedCount} user(s).${
                successDetails ? `\n\n${successDetails}` : ""
              }`
            : `No new assignments made. ${successDetails}`
        }
        autoCloseMs={5000}
      />
      <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
        Follow the steps below to assign training modules to users
      </h2>
      <div className="neon-panel">
        {/* Steps indicator */}
        <div className="neon-button-group">
          <StepDot active={step === 1} label="1) Module" />
          <span>—</span>
          <StepDot active={step === 2} label="2) Departments" />
          <span>—</span>
          <StepDot active={step === 3} label="3) Users" />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="neon-form-section">
            <div className="neon-form-info">
              <strong>Step 1 of 3:</strong> Choose which training module you want to assign to users.
              Once selected, you'll move to the next step to pick departments.
            </div>

            <label className="neon-label">Select Training Module</label>
            <select
              className="neon-input"
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
            >
              <option value="">-- Choose Module --</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <div className="neon-dialog-actions">
              <CustomTooltip text={!canGoNextFrom1 ? "Please select a module first" : "Continue to department selection"}>
                <TextIconButton
                  variant="next"
                  label="Next"
                  onClick={() => setShowDepartmentDialog(true)}
                  disabled={!canGoNextFrom1}
                  aria-label="Next to departments"
                />
              </CustomTooltip>
            </div>
          </div>
        )}

        {/* Step 2 - Department Selection Summary */}
        {step === 2 && (
          <div className="neon-form-section">
            <div className="neon-form-info">
              <strong>Step 2 of 3:</strong> You have selected departments. Review your selection below or modify it by clicking "Change Departments".
            </div>

            <label className="neon-label">Selected Department(s)</label>
            <div className="neon-text" style={{ 
              padding: "12px", 
              border: "1px solid var(--neon)", 
              borderRadius: "4px", 
              marginBottom: "16px" 
            }}>
              {selectedDeptIds.length
                ? `✓ Selected ${selectedDeptIds.length} department(s): ${departments
                    .filter((d) => d.id && selectedDeptIds.includes(d.id))
                    .map((d) => d.name)
                    .join(", ")} (containing ${deptUserCount} user(s))`
                : "No departments selected"}
            </div>
            
            <div className="neon-dialog-actions">
              <CustomTooltip text="Go back to module selection">
                <TextIconButton
                  variant="back"
                  label="Back"
                  onClick={() => setStep(1)}
                  aria-label="Back to module selection"
                />
              </CustomTooltip>
              <CustomTooltip text="Modify department selection">
                <TextIconButton
                  variant="edit"
                  label="Change Departments"
                  onClick={() => setShowDepartmentDialog(true)}
                  aria-label="Change department selection"
                />
              </CustomTooltip>
              <CustomTooltip text={!canGoNextFrom2 ? "Please select at least one department" : "Continue to user selection"}>
                <TextIconButton
                  variant="next"
                  label="Next"
                  onClick={() => {
                    setSelectedUserAuthIds([]);
                    setStep(3);
                  }}
                  disabled={!canGoNextFrom2}
                  aria-label="Next to user selection"
                />
              </CustomTooltip>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="neon-form-section">
            <div className="neon-form-info">
              <strong>Step 3 of 3:</strong> Select the specific users you want to assign this module to.
              You can use the search box to filter users, or use "Select All" to choose everyone from the selected departments.
            </div>

            <div className="neon-form-row">
              <div className="neon-text">
                {filteredUsers.length} user(s) available • {selectedUserAuthIds.length} selected
                {existingAssignments.size > 0 && (
                  <span style={{ color: "var(--warning)", marginLeft: "8px" }}>
                    • {existingAssignments.size} already assigned
                  </span>
                )}
              </div>
              <div className="neon-button-group">
                {/* Select All Checkbox */}
                <label className="neon-form-label">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleSelectAllVisible}
                  />
                  Select All
                </label>
                <input
                  className="neon-input"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="neon-panel">
              {filteredUsers.map((u, idx) => {
                const deptName = u.department_id
                  ? departments.find((d) => d.id === u.department_id)?.name
                  : "No Dept";
                // Create a unique key by combining multiple identifiers
                const key = `${u.auth_id || 'no-auth'}-${u.id || 'no-id'}-${idx}-${u.name.replace(/\s+/g, '-')}`;
                const checked =
                  !!u.auth_id && selectedUserAuthIds.includes(u.auth_id);
                const alreadyAssigned = !!u.auth_id && existingAssignments.has(u.auth_id);
                
                return (
                  <div key={key} className="neon-radio-option" style={{
                    opacity: alreadyAssigned ? 0.6 : 1,
                    backgroundColor: alreadyAssigned ? "var(--warning-bg)" : undefined,
                    border: alreadyAssigned ? "1px solid var(--warning)" : undefined,
                  }}>
                    <input
                      type="checkbox"
                      className="neon-radio"
                      checked={checked}
                      disabled={!u.auth_id || alreadyAssigned}
                      onChange={() => toggleUser(u.auth_id)}
                    />
                    <div className="neon-radio-label">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong>{u.name}</strong>
                        {alreadyAssigned && (
                          <span style={{
                            fontSize: "0.75rem",
                            color: "var(--warning)",
                            backgroundColor: "var(--warning-bg)",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            border: "1px solid var(--warning)",
                          }}>
                            Already Assigned
                          </span>
                        )}
                      </div>
                      <div className="neon-text">
                        {deptName}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!filteredUsers.length && (
                <div className="user-manager-empty">
                  No users match your filters.
                </div>
              )}
            </div>

            <div className="neon-dialog-actions">
              <CustomTooltip text="Go back to department selection">
                <TextIconButton
                  variant="back"
                  label="Back"
                  onClick={() => setStep(2)}
                  aria-label="Back to departments"
                  disabled={assigning}
                />
              </CustomTooltip>
              <CustomTooltip text={!canAssign ? "Please select at least one user" : assigning ? "Assigning module to selected users..." : "Assign module to selected users"}>
                <TextIconButton
                  variant="assign"
                  label={assigning ? "Assigning…" : "Assign Module"}
                  title={assigning ? "Assigning…" : "Assign Module"}
                  onClick={handleAssign}
                  disabled={assigning || !canAssign}
                  aria-label="Assign Module to Users"
                />
              </CustomTooltip>
            </div>
          </div>
        )}

        {feedback && (
          <div className="user-manager-error">
            {feedback}
          </div>
        )}
      </div>

      {/* Department Selection Dialog - Step 2 */}
      <OverlayDialog
        open={showDepartmentDialog}
        onClose={() => setShowDepartmentDialog(false)}
        showCloseButton={true}
        width={800}
        ariaLabelledby="department-dialog-title"
      >
        <div style={{ padding: "24px" }}>
          <h3
            id="department-dialog-title"
            style={{ 
              color: "var(--accent)", 
              fontWeight: 600, 
              fontSize: "1.25rem", 
              marginBottom: "16px" 
            }}
          >
            Select Departments
          </h3>
          
          <div className="neon-form-section">
            <div className="neon-form-info" style={{ marginBottom: "20px" }}>
              <strong>Step 2 of 3:</strong> Select one or more departments from the left panel and move them to the right. Only users from the selected departments will be available in the next step.
            </div>

            <DualPaneSelector
              availableOptions={departments.filter((d) => d.id).map((d) => ({
                label: d.name,
                value: d.id as string,
              }))}
              selectedValues={selectedDeptIds}
              onSelectionChange={(newSelectedIds) => {
                setSelectedUserAuthIds([]); // reset user selection on dept change
                setSelectedDeptIds(newSelectedIds);
              }}
              availableTitle="Available Departments"
              selectedTitle="Selected Departments"
              searchPlaceholder="Search departments..."
            />
            
            <div className="neon-text" style={{ marginTop: "16px", textAlign: "center" }}>
              {selectedDeptIds.length
                ? `✓ Selected ${selectedDeptIds.length} department(s) containing ${deptUserCount} user(s).`
                : "Select at least one department to continue."}
            </div>
            
            <div className="neon-dialog-actions" style={{ marginTop: "24px" }}>
              <CustomTooltip text="Close without saving">
                <TextIconButton
                  variant="cancel"
                  label="Cancel"
                  onClick={() => setShowDepartmentDialog(false)}
                  aria-label="Cancel department selection"
                />
              </CustomTooltip>
              <CustomTooltip text={!canGoNextFrom2 ? "Please select at least one department" : "Continue to user selection"}>
                <TextIconButton
                  variant="next"
                  label="Next"
                  onClick={() => {
                    setSelectedUserAuthIds([]);
                    setStep(2);
                    setShowDepartmentDialog(false);
                  }}
                  disabled={!canGoNextFrom2}
                  aria-label="Next to user selection"
                />
              </CustomTooltip>
            </div>
          </div>
        </div>
      </OverlayDialog>
    </>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={active ? "neon-heading" : "neon-text"}>
      {label}
    </span>
  );
}
