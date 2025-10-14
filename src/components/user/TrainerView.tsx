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
  FiAlertOctagon,
  FiCheckSquare,
  FiActivity,
} from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
import SignaturePad from "react-signature-canvas";
import NeonTable from "../NeonTable";
import NeonForm from "../NeonForm";
import NeonPanel from "../NeonPanel";
import Image from "next/image";
import MainHeader from "@/components/ui/MainHeader";
import TrainingMaterialsManagerDialog from "@/components/training/TrainingMaterialsManagerDialog";
import TrainingQuestionsSection from "../training/TrainingQuestionsSection";
import TrainingQuestionForm from "../training/TrainingQuestionForm";
import TrainingQuestionCategoriesTable from "../training/TrainingQuestionCategoriesTable";
import TrainingQuestionCategory from "../training/TrainingQuestionCategory";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

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
  auth_id: string; // use auth_id, not app user id
  date: string; // ISO yyyy-mm-dd
  topic: string; // module_id or human topic
  duration_hours: number;
  outcome: "completed" | "needs-followup";
  notes?: string | null;
  signature: string; // base64 PNG dataURL
  assignment_id?: string | null;
};

export type Section = "log" | "history" | "assign" | "certs" | "profile" | "questions" | "categories";

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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const canvasProps = useMemo(
    () => ({
      width: 320,
      height: 120,
      className:
        "w-[320px] h-[120px] rounded-lg bg-[var(--field,#012b2b)] shrink-0 touch-none block neon-panel",
    }),
    [],
  );

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

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    onChange("");
  }, [onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="inline-flex items-center gap-2">
        <div className="font-body opacity-80">Draw here</div>
        <CustomTooltip text="Clear signature">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="neon-btn neon-btn-danger neon-btn-global"
          >
            Clear
          </button>
        </CustomTooltip>
      </div>

      <SignaturePad
        ref={padRef}
        penColor="#40E0D0"
        clearOnResize={false}
        canvasProps={canvasProps}
        onEnd={handleEnd}
      />
    </div>
  );
});

export default function TrainerRecordingPage({
  onOpenSection,
}: TrainerRecordingProps) {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [dept, setDept] = useState<string>("all");
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [section, setSection] = useState<Section>("log");
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);

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
        `,
        )
        .order("first_name", { ascending: true });

      if (usersErr) {
        console.error("users error:", usersErr);
        setRows([]);
        return;
      }

      type SupabaseUser = {
        id: string;
        auth_id: string | null;
        first_name?: string | null;
        last_name?: string | null;
        name?: string | null;
        email?: string | null;
        department_id?: string | null;
        departments?:
          | { name?: string | null }[]
          | { name?: string | null }
          | null;
      };

      const mapped: UserRow[] = (users ?? [])
        .map((u: SupabaseUser) => {
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
            departmentName =
              (u.departments as { name?: string | null }).name ?? "";
          }
          return {
            id: u.id,
            auth_id: u.auth_id ?? "", // filtered out below if missing
            name: displayName,
            departmentId: u.department_id ?? "",
            departmentName,
            lastTrainingDate: undefined,
          };
        })
        // Only keep users that can be acted on (must have auth_id)
        .filter((r) => !!r.auth_id);

      setRows(mapped);

      // Fetch modules for question form
      const { data: mods, error: modsErr } = await supabase
        .from("modules")
        .select("id, name")
        .eq("is_archived", false)
        .order("name", { ascending: true });
      if (!modsErr && mods) setModules(mods);
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
  // Assignment fetch for log modal (from user_assignments)
  // ==========================
  type TrainingAssignment = {
    id: string; // user_assignments.id
    module_id: string; // user_assignments.item_id
    module_name?: string | null;
  };

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");

  const fetchAssignments = async (authId: string) => {
    try {
      // Direct assignments that are not completed
      const { data: ua, error: uaErr } = await supabase
        .from("user_assignments")
        .select("id, item_id, item_type, completed_at")
        .eq("auth_id", authId)
        .eq("item_type", "module")
        .is("completed_at", null);

      if (uaErr) throw uaErr;

      let list: TrainingAssignment[] = (ua ?? []).map((row) => ({
        id: row.id,
        module_id: row.item_id,
      }));

      // Fetch module names for nicer labels
      const ids = Array.from(new Set(list.map((a) => a.module_id)));
      if (ids.length) {
        const { data: mods, error: mErr } = await supabase
          .from("modules")
          .select("id, name")
          .in("id", ids);
        if (!mErr && mods?.length) {
          const nameById = new Map(mods.map((m) => [m.id, m.name]));
          list = list.map((a) => ({
            ...a,
            module_name: nameById.get(a.module_id) ?? null,
          }));
        }
      }

      setAssignments(list);
      setSelectedModuleId(list[0]?.module_id || "");
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
      const assignment = assignments.find(
        (a) => a.module_id === selectedModuleId,
      );

      // 1) Insert into training_logs directly (client-side)
      const { error: insertErr } = await supabase.from("training_logs").insert([
        {
          auth_id: openFor.auth_id, // 👈 use auth_id
          date: form.date,
          topic: selectedModuleId, // or assignment?.module_name
          duration_hours: Number(form.durationHours) || 1,
          outcome: form.outcome,
          notes: form.notes?.trim() || null,
          signature: form.signature,
          // assignment_id: assignment?.id ?? null,               // uncomment if column exists
        },
      ]);

      if (insertErr) {
        console.error("Insert training_logs failed:", insertErr);
        alert(`Failed to log training: ${insertErr.message}`);
        setBusy(false);
        return;
      }

      // 2) Mark assignment completed (if we have a UA row id)
      if (assignment?.id) {
        const { error: updateError } = await supabase
          .from("user_assignments")
          .update({ completed_at: new Date().toISOString() })
          .eq("id", assignment.id);

        if (updateError) {
          console.error("Failed to update assignment status:", updateError);
          // Not fatal to the log, so we don't block UX
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
    <div className="after-hero global-content relative">
      <TrainingMaterialsManagerDialog open={materialsDialogOpen} onClose={() => setMaterialsDialogOpen(false)} />
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <MainHeader
          title="Trainer View"
          subtitle="Record, assign, and review training for users"
        />
        <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
          <FiUsers className="text-[var(--neon,#40E0D0)]" aria-hidden /> Record
          Training
        </h2>

        {/* Training Management Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <CustomTooltip text="Manage training materials">
            <button
              className="neon-btn neon-btn-primary neon-btn-global"
              onClick={() => setMaterialsDialogOpen(true)}
            >
              <FiArchive className="mr-2" />
              Training Materials
            </button>
          </CustomTooltip>
          <CustomTooltip text="Manage training questions">
            <button
              className="neon-btn neon-btn-secondary neon-btn-global"
              onClick={() => setSection(section === "questions" ? "log" : "questions")}
            >
              Training Questions
            </button>
          </CustomTooltip>
          <CustomTooltip text="Manage question categories">
            <button
              className="neon-btn neon-btn-secondary neon-btn-global"
              onClick={() => setCategoriesDialogOpen(true)}
            >
              Question Categories
            </button>
          </CustomTooltip>
        </div>

        {/* Controls */}
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <label className="flex items-center gap-2 rounded-xl bg-[var(--field,#012b2b)] px-3 py-2 neon-panel">
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
                <div className="flex items-center justify-center gap-2">
                  <CustomTooltip text="Log a training session">
                    <button
                      className="neon-btn neon-btn-utility neon-btn-global"
                      onClick={() => openLog(row as UserRow)}
                      aria-label="Log session"
                      type="button"
                    >
                      <FiUserPlus />
                    </button>
                  </CustomTooltip>
                  <CustomTooltip text="View training history">
                    <button
                      className="neon-btn neon-btn-history neon-btn-utility neon-btn-global"
                      onClick={() => openHistory(row as UserRow)}
                      aria-label="History"
                      type="button"
                    >
                      <FiClock />
                    </button>
                  </CustomTooltip>
                  <CustomTooltip text="Assign training">
                    <button
                      className="neon-btn neon-btn-assign neon-btn-utility neon-btn-global"
                      onClick={() => onOpenSection?.((row as UserRow).id, "assign")}
                      aria-label="Assign"
                      type="button"
                    >
                      <FiCheckSquare />
                    </button>
                  </CustomTooltip>
                  <CustomTooltip text="View training activity">
                    <button
                      className="neon-btn neon-btn-activity neon-btn-utility neon-btn-global"
                      onClick={() => onOpenSection?.((row as UserRow).id, "profile")}
                      aria-label="Activity"
                      type="button"
                    >
                      <FiActivity />
                    </button>
                  </CustomTooltip>
                  <CustomTooltip text="View certificates & status">
                    <button
                      className="neon-btn neon-btn-cert neon-btn-square neon-btn-utility neon-btn-global"
                      onClick={() => onOpenSection?.((row as UserRow).id, "certs")}
                      aria-label="Certs"
                      type="button"
                    >
                      <FiAward />
                    </button>
                  </CustomTooltip>
                  <CustomTooltip text="Raise an issue">
                    <button
                      className="neon-btn neon-btn-danger neon-btn-utility neon-btn-global"
                      onClick={() => window.open("/raise-issue", "_blank")}
                      aria-label="Raise an issue"
                      type="button"
                    >
                      <FiAlertOctagon />
                    </button>
                  </CustomTooltip>
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
              onClick={(e) => e.stopPropagation()}
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
                <span className="font-body opacity-75 mb-2 block">
                  Today: {new Date().toLocaleDateString()}
                </span>

                <label className="grid gap-1">
                  <span className="font-body opacity-80">Date</span>
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
                  <span className="font-body opacity-80">Duration (hours)</span>
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
                    <span className="font-body opacity-80">Module</span>
                    <select
                      className="neon-input"
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      disabled={busy}
                    >
                      {assignments.map((a) => (
                        <option key={a.id} value={a.module_id}>
                          {a.module_name
                            ? a.module_name
                            : `Module ID: ${a.module_id}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-1">
                    <span className="font-body opacity-80">Module</span>
                    <span className="font-body opacity-60">
                      No modules assigned.
                    </span>
                  </label>
                )}

                <label className="grid gap-1">
                  <span className="font-body opacity-80">Outcome</span>
                  <select
                    className="neon-input"
                    value={form.outcome}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        outcome: e.target.value as LogTrainingPayload["outcome"],
                      }))
                    }
                    disabled={busy}
                  >
                    <option value="completed">Completed</option>
                    <option value="needs-followup">Needs follow-up</option>
                  </select>
                </label>

                <label className="grid gap-1">
                  <span className="font-body opacity-80">Notes</span>
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

                {/* E-signature field */}
                <div className="grid gap-2 mt-3">
                  <span className="font-body opacity-80">
                    E-signature (draw your signature below)
                  </span>
                  <SignatureBox
                    disabled={busy}
                    onChange={handleSignatureChange}
                  />
                  {form.signature && (
                    <Image
                      alt="Signature preview"
                      src={form.signature}
                      width={320}
                      height={120}
                      className="mt-1 w-[320px] h-[120px] object-contain bg-black/10 rounded"
                      unoptimized
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
                        render: (value) => {
                          const sig = value as string | null;
                          return sig ? (
                            <Image
                              src={sig}
                              alt="Signature"
                              width={96}
                              height={48}
                              className="w-24 h-12 object-contain bg-black/10 rounded"
                              unoptimized
                            />
                          ) : (
                            <span className="opacity-50">—</span>
                          );
                        },
                      },
                    ]}
                    data={historyLogs}
                  />
                )}
                <CustomTooltip text="Close history dialog">
                  <button
                    className="neon-btn neon-btn-secondary neon-btn-global mt-4"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setHistoryFor(null)}
                  >
                    Close
                  </button>
                </CustomTooltip>
              </NeonPanel>
            </div>
          </div>
        )}

        {/* Training Questions Section */}
        {section === "questions" && (
          <div style={{ margin: 24 }}>
            <h2>Training Questions</h2>
            <TrainingQuestionCategoriesTable />
          </div>
        )}

        {/* Training Categories Dialog Overlay */}
        {categoriesDialogOpen && (
          <div className="ui-dialog-overlay" onClick={() => setCategoriesDialogOpen(false)}>
            <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
              <NeonPanel>
                <h2>Training Categories</h2>
                <TrainingQuestionCategory />
                <CustomTooltip text="Close categories dialog">
                  <button
                    className="neon-btn neon-btn-secondary neon-btn-global mt-4"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setCategoriesDialogOpen(false)}
                  >
                    Close
                  </button>
                </CustomTooltip>
              </NeonPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
