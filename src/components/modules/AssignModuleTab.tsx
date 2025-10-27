"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import {
  FiSend,
} from "react-icons/fi";
import SearchableDropdown from "@/components/SearchableDropdown";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SuccessModal from "@/components/ui/SuccessModal";

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
      const rows = uniqueAuthIds.map((auth_id) => ({
        auth_id,
        item_id: selectedModule,
        item_type: "module" as const,
        follow_up_required: moduleData?.requires_follow_up || false,
      }));

      const { error } = await supabase
        .from("user_assignments")
        .upsert(rows, { onConflict: "auth_id,item_id,item_type" });

      if (error) {
        setFeedback(`Assignment failed: ${error.message}
If this persists, check Row Level Security policies on "user_assignments".`);
        return;
      }

      // Show success modal
      setAssignedCount(rows.length);
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
        title="Assignment Successful!"
        message={`Successfully assigned "${moduleName}" to ${selectedUserAuthIds.length} user(s).`}
        autoCloseMs={3000}
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
                <NeonIconButton
                  variant="next"
                  title="Next"
                  onClick={() => setStep(2)}
                  disabled={!canGoNextFrom1}
                  aria-label="Next to departments"
                />
              </CustomTooltip>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="neon-form-section">
            <div className="neon-form-info">
              <strong>Step 2 of 3:</strong> Select one or more departments. Only users from the selected departments will be available in the next step.
              You can select multiple departments at once.
            </div>

            <label className="neon-label">Select Department(s)</label>
            <SearchableDropdown
              options={departments.filter((d) => d.id).map((d) => ({
                label: d.name,
                value: d.id as string,
              }))}
              multi
              value={selectedDeptIds}
              onSelect={(vals) => {
                setSelectedUserAuthIds([]); // reset user selection on dept change
                setSelectedDeptIds(Array.isArray(vals) ? vals : [vals]);
              }}
              placeholder="Select department(s)..."
            />
            <div className="neon-text">
              {selectedDeptIds.length
                ? `✓ Selected ${selectedDeptIds.length} department(s) containing ${deptUserCount} user(s).`
                : "Pick at least one department to continue."}
            </div>
            <div className="neon-dialog-actions">
              <CustomTooltip text="Go back to module selection">
                <NeonIconButton
                  variant="back"
                  title="Back"
                  onClick={() => setStep(1)}
                  aria-label="Back to module selection"
                />
              </CustomTooltip>
              <CustomTooltip text={!canGoNextFrom2 ? "Please select at least one department" : "Continue to user selection"}>
                <NeonIconButton
                  variant="next"
                  title="Next"
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
                const key = u.auth_id ?? u.id ?? `user-${idx}`;
                const checked =
                  !!u.auth_id && selectedUserAuthIds.includes(u.auth_id);
                return (
                  <div key={key} className="neon-radio-option">
                    <input
                      type="checkbox"
                      className="neon-radio"
                      checked={checked}
                      disabled={!u.auth_id}
                      onChange={() => toggleUser(u.auth_id)}
                    />
                    <div className="neon-radio-label">
                      <strong>{u.name}</strong>
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
                <NeonIconButton
                  variant="back"
                  title="Back"
                  onClick={() => setStep(2)}
                  aria-label="Back to departments"
                  disabled={assigning}
                />
              </CustomTooltip>
              <CustomTooltip text={!canAssign ? "Please select at least one user" : assigning ? "Assigning module to selected users..." : "Assign module to selected users"}>
                <NeonIconButton
                  variant="assign"
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
