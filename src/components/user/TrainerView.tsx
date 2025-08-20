"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  FiUsers,
  FiUserPlus,
  FiClock,
  FiArchive,
  FiAward,
  FiFilter,
} from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import SignaturePad from "react-signature-canvas";
import NeonTable from "../NeonTable";
import NeonForm from "../NeonForm";
import NeonPanel from "../NeonPanel";

// ==========================
// Types
// ==========================
export type Dept = { id: string; name: string };

export type UserRow = {
  id: string;
  auth_id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  lastTrainingDate?: string; // ISO
};

export type LogTrainingPayload = {
  userId: string;
  date: string; // ISO yyyy-mm-dd
  topic: string;
  durationHours: number;
  outcome: "completed" | "needs-followup";
  notes?: string;
  signature: string; // base64 PNG dataURL
};

export type Section = "log" | "history" | "assign" | "certs" | "profile";

export interface TrainerRecordingProps {
  users?: UserRow[];
  departments?: Dept[];
  pageSize?: number;
  onOpenSection?: (userId: string, section: Section) => void;
}

// ==========================
// Utils
// ==========================
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

// Trim transparent edges from a canvas (local helper)
function trimCanvasLocal(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d");
  if (!ctx) return src;

  const { width, height } = src;
  const { data } = ctx.getImageData(0, 0, width, height);

  let top = 0,
    left = 0,
    right = width - 1,
    bottom = height - 1;
  let found = false;

  const rowHasInk = (y: number) => {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] !== 0) return true; // alpha
    }
    return false;
  };
  const colHasInk = (x: number) => {
    for (let y = 0; y < height; y++) {
      if (data[(y * width + x) * 4 + 3] !== 0) return true;
    }
    return false;
  };

  for (let y = 0; y < height; y++) {
    if (rowHasInk(y)) {
      top = y;
      found = true;
      break;
    }
  }
  if (!found) return src;

  for (let y = height - 1; y >= 0; y--) {
    if (rowHasInk(y)) {
      bottom = y;
      break;
    }
  }
  for (let x = 0; x < width; x++) {
    if (colHasInk(x)) {
      left = x;
      break;
    }
  }
  for (let x = width - 1; x >= 0; x--) {
    if (colHasInk(x)) {
      right = x;
      break;
    }
  }

  const w = Math.max(1, right - left + 1);
  const h = Math.max(1, bottom - top + 1);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d");
  if (outCtx) outCtx.drawImage(src, left, top, w, h, 0, 0, w, h);
  return out;
}

// ==========================
// Supabase Client
// ==========================
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ==========================
// SignatureBox (isolated/memoized)
// ==========================
type SignatureBoxProps = {
  disabled?: boolean;
  onChange: (dataUrl: string) => void; // called on pen up
};

const SignatureBox = React.memo(function SignatureBox({
  disabled,
  onChange,
}: SignatureBoxProps) {
  const padRef = useRef<SignaturePad>(null);

  // Stable canvas props so the component isn't recreated
  const canvasProps = useMemo(
    () => ({
      width: 320,
      height: 120,
      className:
        "w-[320px] h-[120px] border border-dashed rounded-lg bg-[var(--field,#012b2b)] shrink-0 touch-none block",
    }),
    []
  );

  // Stable handler so React.memo doesn't re-render the child
  const handleEnd = useCallback(() => {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) {
      onChange("");
      return;
    }
    const canvas = pad.getCanvas();
    const trimmed = trimCanvasLocal(canvas);
    onChange(trimmed.toDataURL("image/png"));
  }, [onChange]);

  // Clear without causing a parent re-render
  const handleClear = useCallback(() => {
    padRef.current?.clear();
    onChange("");
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2">
        <div className="text-sm opacity-80">Draw here</div>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="neon-btn neon-btn-danger"
          title="Clear signature"
        >
          Clear
        </button>
      </div>

      <SignaturePad
        ref={padRef}
        penColor="#40E0D0"
        // NOTE: some versions ignore this, but it's harmless when present
        clearOnResize={false}
        canvasProps={canvasProps}
        onEnd={handleEnd}
      />
    </div>
  );
});

// ==========================
// Component
// ==========================
export default function TrainerRecordingPage({
  onOpenSection,
}: TrainerRecordingProps) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [dept, setDept] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      // 1) Departments
      const { data: departments, error: deptErr } = await supabase
        .from("departments")
        .select("id, name")
        .order("name", { ascending: true });

      if (deptErr) console.error("departments error:", deptErr);
      if (departments) setDepts(departments);

      // 2) Users + department join
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select(
          `
          id,
          auth_id,
          first_name,
          last_name,
          email,
          department_id,
          departments ( name )
        `
        )
        .order("first_name", { ascending: true });

      if (usersErr) {
        console.error("users error:", usersErr);
        setRows([]);
        return;
      }

      type SupabaseUser = {
        id: string;
        auth_id: string;
        first_name?: string;
        last_name?: string;
        name?: string;
        email?: string;
        department_id?: string;
        departments?: { name?: string }[] | { name?: string };
      };

      const mapped: UserRow[] = (users ?? []).map((u: SupabaseUser) => {
        const displayName =
          [u.first_name, u.last_name].filter(Boolean).join(" ").trim() ||
          u.name ||
          u.email ||
          "—";
        let departmentName = "";
        if (Array.isArray(u.departments) && u.departments.length > 0) {
          departmentName = u.departments[0]?.name ?? "";
        } else if (
          u.departments &&
          typeof u.departments === "object" &&
          "name" in u.departments
        ) {
          departmentName = (u.departments as { name?: string }).name ?? "";
        }
        return {
          id: u.id,
          auth_id: u.auth_id,
          name: displayName,
          departmentId: u.department_id ?? "",
          departmentName,
          lastTrainingDate: undefined,
        };
      });

      setRows(mapped);
    }

    fetchData();
  }, []);

  // Modal state for quick log
  const [openFor, setOpenFor] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    durationHours: 1,
    outcome: "completed" as LogTrainingPayload["outcome"],
    notes: "",
    signature: "",
  });
  const [busy, setBusy] = useState(false);

  // ==========================
  // Assignment fetch for log modal
  // ==========================
  type TrainingAssignment = {
    id: string;
    module_id: string;
  };

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const fetchAssignments = async (authId: string) => {
    try {
      // Fetch user to get role_profile_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, role_profile_id")
        .eq("auth_id", authId)
        .single();
      if (userError || !userData) throw userError;
      let assignments: TrainingAssignment[] = [];
      // 1. Direct assignments
      const { data: directAssignments, error: directError } = await supabase
        .from("user_training_assignments")
        .select("id, module_id, status")
        .eq("auth_id", authId);
      if (directError) throw directError;
      assignments = (directAssignments || []).filter(a => a.status !== "completed").map(({ id, module_id }) => ({ id, module_id }));
      // 2. Role profile modules
      if (userData.role_profile_id) {
        const { data: rpModules, error: rpError } = await supabase
          .from("role_profile_modules")
          .select("module_id")
          .eq("role_profile_id", userData.role_profile_id);
        if (!rpError && rpModules) {
          // Add modules from role profile if not already assigned
          const alreadyAssigned = new Set(assignments.map(a => a.module_id));
          rpModules.forEach((m: { module_id: string }) => {
            if (!alreadyAssigned.has(m.module_id)) {
              assignments.push({ id: `roleprofile-${m.module_id}`, module_id: m.module_id });
            }
          });
        }
      }
      setAssignments(assignments);
      setSelectedModuleId(assignments[0]?.module_id || "");
    } catch (e) {
      console.error("Failed to fetch assignments:", e);
      setAssignments([]);
      setSelectedModuleId("");
    }
  };

  // ==========================
  // History Modal
  // ==========================
  type TrainingLog = {
    id: string;
    date: string;
    topic: string;
    duration_hours: number;
    outcome: string;
    notes: string | null;
    signature: string | null;
  };

  const [historyFor, setHistoryFor] = useState<UserRow | null>(null);
  const [historyLogs, setHistoryLogs] = useState<TrainingLog[]>([]);
  const [historyBusy, setHistoryBusy] = useState(false);

  const openHistory = async (user: UserRow) => {
    setHistoryFor(user);
    setHistoryBusy(true);
    try {
      const { data, error } = await supabase
        .from("training_logs")
        .select("id, date, topic, duration_hours, outcome, notes, signature")
        .eq("auth_id", user.auth_id)
        .order("date", { ascending: false });
      if (error) throw error;
      setHistoryLogs(data || []);
    } catch (e) {
      console.error("Failed to fetch training logs:", e);
      setHistoryLogs([]);
    } finally {
      setHistoryBusy(false);
    }
  };

  // Derived
  const filtered = useMemo(() => {
    return rows
      .filter((r) => (dept === "all" ? true : r.departmentId === dept))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, dept]);

  // Handlers
  const openLog = async (u: UserRow) => {
    setOpenFor(u);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      durationHours: 1,
      outcome: "completed",
      notes: "",
      signature: "",
    });
    await fetchAssignments(u.auth_id);
  };

  const handleSignatureChange = useCallback((dataUrl: string) => {
    // Store into form without touching the signature pad component
    setForm((f) => ({ ...f, signature: dataUrl }));
  }, []);

  const submitLog = async () => {
    if (!openFor) return;
    if (!selectedModuleId) {
      alert("Please select a module.");
      return;
    }
    if (!form.signature.trim()) {
      alert("Please provide your e-signature.");
      return;
    }

    setBusy(true);
    try {
      const assignment = assignments.find((a) => a.module_id === selectedModuleId);
      const payload = {
        auth_id: openFor.id,
        date: form.date, // "YYYY-MM-DD"
        topic: selectedModuleId, // use module_id as topic
        duration_hours: Number(form.durationHours) || 1,
        outcome: form.outcome,
        notes: form.notes?.trim() || null,
        signature: form.signature, // base64 PNG dataURL
        assignment_id: assignment?.id || null,
      };

      // Insert training log
      const res = await fetch("/api/training-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error("Save failed:", json);
        alert(`Failed to log training: ${json.error || "Unknown error"}`);
        return;
      }

      // Mark assignment as completed
      if (assignment?.id && /^[0-9a-fA-F-]{36}$/.test(assignment.id)) {
        const { error: updateError } = await supabase
          .from("user_training_assignments")
          .update({ status: "completed" })
          .eq("id", assignment.id);
        if (updateError) {
          console.error("Failed to update assignment status:", updateError);
          // Optionally alert or ignore
        }
      }

      setOpenFor(null);
    } catch (e) {
      console.error(e);
      alert("Failed to log training.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="after-hero global-content">
      <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
        <FiUsers className="text-[var(--neon,#40E0D0)]" aria-hidden /> Record
        Training
      </h2>

      {/* Controls */}
      <div className="grid gap-3 md:grid-cols-2 mb-4">
        <label className="flex items-center gap-2 rounded-xl border border-[var(--border,#40E0D0)]/30 bg-[var(--field,#012b2b)] px-3 py-2">
          <FiFilter aria-hidden />
          <select
            aria-label="Filter by department"
            className="w-full bg-transparent outline-none"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
          >
            <option value="all">All departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Table */}
      <NeonTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Department", accessor: "departmentName" },
          {
            header: "Last training",
            accessor: "lastTrainingDate",
            render: (v) => formatDate(v as string),
          },
          {
            header: "Actions",
            accessor: "actions",
            render: (_, row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  className="neon-utility-btn"
                  onClick={() => openLog(row as UserRow)}
                  title="Log a training session"
                >
                  <FiUserPlus /> Log session
                </button>
                <button
                  className="neon-utility-btn"
                  onClick={() => openHistory(row as UserRow)}
                  title="View training history"
                >
                  <FiArchive /> History
                </button>
                <button
                  className="neon-utility-btn"
                  onClick={() =>
                    onOpenSection?.((row as UserRow).id, "assign")
                  }
                  title="Assign training"
                >
                  <FiClock /> Assign
                </button>
                <button
                  className="neon-utility-btn"
                  onClick={() =>
                    onOpenSection?.((row as UserRow).id, "certs")
                  }
                  title="Certificates & status"
                >
                  <FiAward /> Certs
                </button>
              </div>
            ),
          },
        ]}
        data={filtered}
      />

      {/* Simple overlay + centered dialog */}
      {openFor && (
        <div
          className="ui-dialog-overlay"
          onClick={() => !busy && setOpenFor(null)}
        >
          <div
            className="ui-dialog-content"
            onClick={(e) => e.stopPropagation()} // prevent overlay close when clicking inside
          >
            <NeonForm
              title={`Log training • ${openFor.name} • ${openFor.departmentName}`}
              submitLabel={busy ? "Saving…" : "Save log"}
              onSubmit={(e) => {
                e.preventDefault();
                submitLog();
              }}
              onCancel={() => !busy && setOpenFor(null)}
            >
              <span className="text-sm opacity-75 mb-2 block">
                Today: {new Date().toLocaleDateString()}
              </span>

              <label className="grid gap-1">
                <span className="text-sm opacity-80">Date</span>
                <input
                  type="date"
                  className="neon-input"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  disabled={busy}
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm opacity-80">Duration (hours)</span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  className="neon-input"
                  value={form.durationHours}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationHours: Number(e.target.value),
                    }))
                  }
                  disabled={busy}
                />
              </label>

              {assignments.length > 0 ? (
                <label className="grid gap-1">
                  <span className="text-sm opacity-80">Module</span>
                  <select
                    className="neon-input"
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    disabled={busy}
                  >
                    {assignments.map((a) => (
                      <option key={a.id} value={a.module_id}>
                        Module ID: {a.module_id}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="grid gap-1">
                  <span className="text-sm opacity-80">Module</span>
                  <span className="text-xs opacity-60">
                    No modules assigned.
                  </span>
                </label>
              )}

              <label className="grid gap-1">
                <span className="text-sm opacity-80">Outcome</span>
                <select
                  className="neon-input"
                  value={form.outcome}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      outcome: e.target
                        .value as LogTrainingPayload["outcome"],
                    }))
                  }
                  disabled={busy}
                >
                  <option value="completed">Completed</option>
                  <option value="needs-followup">Needs follow-up</option>
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-sm opacity-80">Notes</span>
                <textarea
                  rows={4}
                  className="neon-input"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  disabled={busy}
                  placeholder="Key points covered, observed competency, follow-up actions…"
                />
              </label>

              {/* E-signature field (isolated, won't disappear) */}
              <div className="grid gap-2 mt-3">
                <span className="text-sm opacity-80">
                  E-signature (draw your signature below)
                </span>
                <SignatureBox
                  disabled={busy}
                  onChange={handleSignatureChange}
                />
                {/* Optional preview to confirm it's captured */}
                {form.signature && (
                  <img
                    alt="Signature preview"
                    src={form.signature}
                    className="mt-1 w-[320px] h-[120px] object-contain bg-black/10 rounded"
                  />
                )}
              </div>
            </NeonForm>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyFor && (
        <div className="ui-dialog-overlay" onClick={() => setHistoryFor(null)}>
          <div
            className="ui-dialog-content"
            onClick={(e) => e.stopPropagation()}
          >
            <NeonPanel>
              <h3 className="text-xl font-semibold mb-2">
                Training History – {historyFor.name}
              </h3>
              {historyBusy ? (
                <div className="text-center py-8 text-neon">Loading…</div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-8 opacity-70">
                  No training logs found.
                </div>
              ) : (
                <NeonTable
                  columns={[
                    { header: "Date", accessor: "date" },
                    { header: "Topic", accessor: "topic" },
                    { header: "Duration", accessor: "duration_hours" },
                    { header: "Outcome", accessor: "outcome" },
                    { header: "Notes", accessor: "notes" },
                    {
                      header: "Signature",
                      accessor: "signature",
                      render: (sig) =>
                        typeof sig === "string" && sig ? (
                          <img
                            src={sig}
                            alt="Signature"
                            className="w-24 h-12 object-contain bg-black/10 rounded"
                          />
                        ) : (
                          <span className="opacity-50">—</span>
                        ),
                    },
                  ]}
                  data={historyLogs}
                />
              )}
              <button
                className="neon-btn neon-btn-secondary mt-4"
                onClick={() => setHistoryFor(null)}
              >
                Close
              </button>
            </NeonPanel>
          </div>
        </div>
      )}
    </div>
  );
}
