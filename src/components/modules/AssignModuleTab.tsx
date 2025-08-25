"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonIconButton from "@/components/ui/NeonIconButton";
import {
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiCheckSquare,
  FiSquare,
} from "react-icons/fi";

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
      const uniqueAuthIds = Array.from(
        new Set(selectedUserAuthIds.filter(Boolean)),
      );
      const rows = uniqueAuthIds.map((auth_id) => ({
        auth_id,
        item_id: selectedModule,
        item_type: "module" as const,
      }));

      const { error } = await supabase
        .from("user_assignments")
        .upsert(rows, { onConflict: "auth_id,item_id,item_type" });

      if (error) {
        setFeedback(`Assignment failed: ${error.message}
If this persists, check Row Level Security policies on "user_assignments".`);
        return;
      }

      setFeedback(
        `Assigned "${modules.find((m) => m.id === selectedModule)?.name ?? "Module"}" to ${rows.length} user(s).`,
      );
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

  if (loading)
    return (
      <div className="neon-loading" style={{ padding: "1rem" }}>
        Loading…
      </div>
    );

  return (
    <div className="neon-panel-module" style={{ display: "grid", gap: "1rem" }}>
      <h3
        className="neon-section-title"
        style={{ display: "flex", alignItems: "center", gap: 8 }}
      >
        <NeonIconButton
          variant="edit"
          icon={<FiSend />}
          title="Assign Training Module"
        />
        Bulk Assignment Wizard
      </h3>

      {/* Steps indicator */}
      <div
        style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}
      >
        <StepDot active={step === 1} label="1) Module" />
        <div>—</div>
        <StepDot active={step === 2} label="2) Departments" />
        <div>—</div>
        <StepDot active={step === 3} label="3) Users" />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ display: "grid", gap: 8 }}>
          <label className="neon-label">Select Module</label>
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

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              className="neon-btn"
              disabled={!canGoNextFrom1}
              onClick={() => setStep(2)}
              title="Next: choose departments"
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ display: "grid", gap: 8 }}>
          <label className="neon-label">Select Department(s)</label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 8,
              border: "1px solid var(--border, #2b2b2b)",
              padding: 8,
              borderRadius: 8,
            }}
          >
            {departments.map((d, idx) => {
              const id = d.id ?? null;
              const checked = !!id && selectedDeptIds.includes(id);
              return (
                <label
                  key={id ?? `dept-${idx}`}
                  className="neon-checkbox"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 8,
                    borderRadius: 8,
                    cursor: id ? "pointer" : "not-allowed",
                    opacity: id ? 1 : 0.5,
                    background: checked ? "rgba(0,0,0,0.12)" : "transparent",
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={!id}
                    checked={checked}
                    onChange={() => id && toggleDept(id)}
                  />
                  <span>{d.name}</span>
                </label>
              );
            })}
          </div>

          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {selectedDeptIds.length
              ? `Selected ${selectedDeptIds.length} dept(s) containing ${deptUserCount} user(s).`
              : "Pick at least one department to continue."}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <button
              className="neon-btn ghost"
              onClick={() => setStep(1)}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <FiChevronLeft /> Back
            </button>
            <button
              className="neon-btn"
              disabled={!canGoNextFrom2}
              onClick={() => {
                setSelectedUserAuthIds([]);
                setStep(3);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              title="Next: choose users"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="neon-btn ghost"
                onClick={() => setStep(2)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <FiChevronLeft /> Back
              </button>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {filteredUsers.length} user(s) in selected department(s)
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="neon-btn"
                onClick={toggleSelectAllVisible}
                title={
                  allChecked ? "Unselect all visible" : "Select all visible"
                }
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {allChecked ? <FiCheckSquare /> : <FiSquare />}
                {allChecked ? "Unselect All" : "Select All"}
              </button>
              <input
                className="neon-input"
                placeholder="Search users…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: 240 }}
              />
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border, #2b2b2b)",
              borderRadius: 8,
              maxHeight: 360,
              overflow: "auto",
              padding: 8,
              display: "grid",
              gap: 6,
            }}
          >
            {filteredUsers.map((u, idx) => {
              const deptName = u.department_id
                ? departments.find((d) => d.id === u.department_id)?.name
                : "No Dept";
              const key = u.auth_id ?? u.id ?? `user-${idx}`;
              const checked =
                !!u.auth_id && selectedUserAuthIds.includes(u.auth_id);
              return (
                <label
                  key={key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    background: checked ? "rgba(0,0,0,0.12)" : "transparent",
                    cursor: u.auth_id ? "pointer" : "not-allowed",
                    opacity: u.auth_id ? 1 : 0.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!u.auth_id}
                    onChange={() => toggleUser(u.auth_id)}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong>{u.name}</strong>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>
                      {deptName}
                    </span>
                  </div>
                  <code style={{ fontSize: 11, opacity: 0.7 }}>
                    {u.auth_id ?? "no auth_id"}
                  </code>
                </label>
              );
            })}
            {!filteredUsers.length && (
              <div style={{ padding: 12, opacity: 0.8 }}>
                No users match your filters.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <NeonIconButton
              variant="edit"
              icon={<FiSend />}
              title={assigning ? "Assigning…" : "Assign Module"}
              onClick={handleAssign}
              disabled={assigning || !canAssign}
            />
          </div>
        </div>
      )}

      {feedback && (
        <div
          className="neon-info"
          style={{ marginTop: 6, whiteSpace: "pre-line" }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

function StepDot({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: active
          ? "var(--dot-active, rgba(0,0,0,0.2))"
          : "var(--dot, rgba(0,0,0,0.08))",
        fontWeight: active ? 600 : 500,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: active ? "var(--accent, #0ea5e9)" : "rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
