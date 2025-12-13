"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  FiAward,
  FiX,
} from "react-icons/fi";
import TextIconButton from "@/components/ui/TextIconButtons";
import { supabase } from "@/lib/supabase-client";
import SignaturePad from "react-signature-canvas";
import NeonTable from "../NeonTable";
import NeonForm from "../NeonForm";
import NeonPanel from "../NeonPanel";
import Image from "next/image";
import TrainingMaterialsManagerDialog from "@/components/training/TrainingMaterialsManagerDialog";
import TrainingQuestionsSection from "../training/TrainingQuestionsSection";
import TrainingQuestionForm from "../training/TrainingQuestionForm";
import TrainingQuestionCategoriesTable from "../training/TrainingQuestionCategoriesTable";
import TrainingQuestionCategory from "../training/TrainingQuestionCategory";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";
import TrainerViewToolbar from "@/components/ui-toolbars/TrainerViewToolbar";
import TestRunner from "@/components/training/TestRunner";

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
  outcome: "completed" | "needs_improvement" | "failed";
  notes?: string | null;
  signature: string; // base64 PNG dataURL
  assignment_id?: string | null;
};

export type Section = "log" | "history" | "assign" | "certs" | "profile" | "questions" | "categories";

export interface TrainerRecordingProps {
  users?: UserRow[];
  departments?: Dept[];
  pageSize?: number;
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

// Supabase client is now imported from @/lib/supabase-client (authenticated)

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
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasProps = useMemo(
    () => ({
      className:
        "w-full h-[200px] rounded-lg bg-[var(--field,#012b2b)] shrink-0 touch-none block neon-panel",
      style: {
        width: '100%',
        height: '200px',
      },
    }),
    [],
  );

  // Resize canvas to match container dimensions for accurate cursor tracking
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = padRef.current?.getCanvas();
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = rect.width * ratio;
      canvas.height = 200 * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      padRef.current?.clear();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-body font-medium opacity-70 text-sm">Draw your signature in the area below</div>
        <CustomTooltip text="Clear signature">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="neon-btn neon-btn-back"
            style={{
              padding: '8px',
              fontSize: '0.875rem',
              minWidth: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX size={18} />
          </button>
        </CustomTooltip>
      </div>

      <div ref={containerRef} style={{ width: '100%', maxWidth: '500px' }}>
        <SignaturePad
          ref={padRef}
          penColor="#40E0D0"
          clearOnResize={false}
          canvasProps={canvasProps}
          onEnd={handleEnd}
          velocityFilterWeight={0.7}
          minWidth={0.5}
          maxWidth={2.5}
          dotSize={1}
          throttle={8}
        />
      </div>
    </div>
  );
});

export default function TrainerRecordingPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [depts, setDepts] = useState<Dept[]>([]);
  const [dept, setDept] = useState<string>("all");
  const [materialsDialogOpen, setMaterialsDialogOpen] = useState(false);
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [section, setSection] = useState<Section>("log");
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [csvResultModal, setCsvResultModal] = useState<{
    open: boolean;
    success: number;
    errors: number;
    errorDetails: string[];
  }>({
    open: false,
    success: 0,
    errors: 0,
    errorDetails: [],
  });

  // Certificates dialog state
  type CompletedModule = {
    module_id: string;
    module_name: string;
    completed_at: string;
    user_auth_id: string;
    user_name: string;
  };

  const [certificatesDialog, setCertificatesDialog] = useState<{
    open: boolean;
    user: UserRow | null;
    modules: CompletedModule[];
    loading: boolean;
  }>({
    open: false,
    user: null,
    modules: [],
    loading: false,
  });

  // Fetch data function (extracted so it can be reused)
  const fetchData = async () => {
    // 1) Departments
    const { data: departments, error: deptErr } = await supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true });

    if (deptErr) console.error("departments error:", deptErr);
    if (departments) setDepts(departments);

    // 2) Fetch users who have incomplete assignments (completed_at is NULL)
    const { data: incompleteAssignments, error: assignmentsErr } = await supabase
      .from("user_assignments")
      .select("auth_id")
      .is("completed_at", null);

    if (assignmentsErr) {
      console.error("assignments error:", assignmentsErr);
      setRows([]);
      return;
    }

    // Get unique auth_ids with incomplete training
    const authIdsWithIncomplete = Array.from(
      new Set((incompleteAssignments ?? []).map((a) => a.auth_id))
    );

    if (authIdsWithIncomplete.length === 0) {
      // No users with incomplete training
      setRows([]);
      return;
    }

    // 3) Fetch only users who have incomplete assignments
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
      .in("auth_id", authIdsWithIncomplete)
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Modal state for quick log
  const [openFor, setOpenFor] = useState<UserRow | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    durationHours: 1,
    outcome: "completed" as LogTrainingPayload["outcome"],
    notes: "",
    learnerSignature: "",
    trainerSignature: "",
  });
  const [busy, setBusy] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);

  // ==========================
  // Assignment fetch for log modal (from user_assignments)
  // ==========================
  type TrainingAssignment = {
    id: string; // user_assignments.id
    module_id: string; // user_assignments.item_id
    module_name?: string | null;
  };

  type DocumentAssignment = {
    id: string; // user_assignments.id
    document_id: string; // user_assignments.item_id
    document_title?: string | null;
    reference_code?: string | null;
    document_url?: string | null;
    assigned_at: string;
    due_at: string | null;
    confirmation_required: boolean;
    confirmed_at: string | null;
  };

  const [assignments, setAssignments] = useState<TrainingAssignment[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [documentAssignments, setDocumentAssignments] = useState<DocumentAssignment[]>([]);

  // State for available tests and documents that can be assigned
  const [associatedTests, setAssociatedTests] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedTestsToAssign, setSelectedTestsToAssign] = useState<string[]>([]);
  const [associatedDocuments, setAssociatedDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedDocsToAssign, setSelectedDocsToAssign] = useState<string[]>([]);

  // Test runner dialog state
  const [testRunnerDialog, setTestRunnerDialog] = useState<{
    open: boolean;
    packId: string | null;
    userId: string | null;
  }>({
    open: false,
    packId: null,
    userId: null,
  });

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

  const fetchDocumentAssignments = async (authId: string) => {
    try {
      // Fetch document assignments (both confirmed and pending)
      const { data: docAssignments, error: docErr } = await supabase
        .from("user_assignments")
        .select("id, item_id, assigned_at, due_at, confirmation_required, confirmed_at")
        .eq("auth_id", authId)
        .eq("item_type", "document")
        .order("assigned_at", { ascending: false });

      if (docErr) throw docErr;

      let docList: DocumentAssignment[] = (docAssignments ?? []).map((row) => ({
        id: row.id,
        document_id: row.item_id,
        assigned_at: row.assigned_at,
        due_at: row.due_at,
        confirmation_required: row.confirmation_required ?? false,
        confirmed_at: row.confirmed_at,
      }));

      // Fetch document details
      const docIds = Array.from(new Set(docList.map((a) => a.document_id)));
      if (docIds.length) {
        const { data: docs, error: docsErr } = await supabase
          .from("documents")
          .select("id, title, reference_code, document_url")
          .in("id", docIds);

        if (!docsErr && docs?.length) {
          const docById = new Map(docs.map((d) => [d.id, d]));
          docList = docList.map((a) => {
            const doc = docById.get(a.document_id);
            return {
              ...a,
              document_title: doc?.title ?? null,
              reference_code: doc?.reference_code ?? null,
              document_url: doc?.document_url ?? null,
            };
          });
        }
      }

      setDocumentAssignments(docList);
    } catch (e) {
      console.error("Failed to fetch document assignments:", e);
      setDocumentAssignments([]);
    }
  };

  // ==========================
  // Fetch available tests and documents for assignment
  // ==========================
  const fetchAssociatedTests = async (moduleId: string) => {
    try {
      console.log("🔍 Fetching tests for module:", moduleId);
      const { data: tests, error } = await supabase
        .from("question_packs")
        .select("id, title, module_id")
        .eq("is_active", true)
        .eq("module_id", moduleId)
        .order("title", { ascending: true });

      if (error) throw error;
      console.log("📦 Found tests:", tests);

      const linkedTests = (tests || []).map(t => ({ id: t.id, title: t.title }));
      console.log("✅ Setting associated tests:", linkedTests);

      setAssociatedTests(linkedTests);
      setSelectedTestsToAssign([]);
    } catch (e) {
      console.error("❌ Failed to fetch associated tests:", e);
      setAssociatedTests([]);
    }
  };

  const fetchAssociatedDocuments = async (moduleId: string) => {
    try {
      console.log("🔍 Fetching documents for module:", moduleId);
      const { data: docs, error } = await supabase
        .from("documents")
        .select("id, title, module_id")
        .eq("module_id", moduleId)
        .order("title", { ascending: true });

      if (error) throw error;
      console.log("📄 Found documents:", docs);

      const linkedDocs = (docs || []).map(d => ({ id: d.id, title: d.title }));
      console.log("✅ Setting associated documents:", linkedDocs);

      setAssociatedDocuments(linkedDocs);
      setSelectedDocsToAssign([]);
    } catch (e) {
      console.error("❌ Failed to fetch associated documents:", e);
      setAssociatedDocuments([]);
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
    console.log("=== Opening training history ===");
    console.log("User:", user.name);
    console.log("User auth_id:", user.auth_id);
    setHistoryFor(user);
    setHistoryBusy(true);
    try {
      // Fetch from training_logs (detailed session records with signatures)
      const { data: logsData, error: logsError } = await supabase
        .from("training_logs")
        .select("id, date, topic, duration_hours, outcome, notes, signature")
        .eq("auth_id", user.auth_id)
        .order("date", { ascending: false });

      console.log("Training logs - data:", logsData);
      console.log("Training logs - error:", logsError);

      // Fetch from user_assignments (all completions including historical)
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("user_assignments")
        .select("item_id, item_type, completed_at")
        .eq("auth_id", user.auth_id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false});

      console.log("User assignments - data:", assignmentsData);
      console.log("User assignments - error:", assignmentsError);

      if (logsError) throw logsError;

      // Combine both sources into a unified history
      const combinedLogs: TrainingLog[] = [];

      // Add detailed training logs
      if (logsData && logsData.length > 0) {
        combinedLogs.push(...logsData.map(log => ({
          id: log.id,
          date: log.date,
          topic: log.topic,
          duration_hours: log.duration_hours,
          outcome: log.outcome,
          notes: log.notes,
          signature: log.signature,
        })));
      }

      // Fetch module and document names for assignments
      const allItemIds = (assignmentsData || []).map(a => a.item_id).filter(Boolean);
      const moduleIds = [...new Set(allItemIds)];
      let moduleNamesMap = new Map<string, string>();
      let documentNamesMap = new Map<string, string>();

      if (moduleIds.length > 0) {
        const { data: modulesData } = await supabase
          .from("modules")
          .select("id, name")
          .in("id", moduleIds);

        if (modulesData) {
          modulesData.forEach(m => moduleNamesMap.set(m.id, m.name));
        }

        const { data: documentsData } = await supabase
          .from("documents")
          .select("id, title")
          .in("id", moduleIds);

        if (documentsData) {
          documentsData.forEach(d => documentNamesMap.set(d.id, d.title));
        }
      }

      // Add completion records from assignments (if not already in training_logs)
      if (assignmentsData && assignmentsData.length > 0) {
        for (const assignment of assignmentsData) {
          if (!combinedLogs.some(log => log.topic === assignment.item_id && log.date === assignment.completed_at?.split('T')[0])) {
            const itemName = assignment.item_type === 'module'
              ? moduleNamesMap.get(assignment.item_id || '')
              : documentNamesMap.get(assignment.item_id || '');

            combinedLogs.push({
              id: `assignment-${assignment.item_id}`,
              date: assignment.completed_at?.split('T')[0] || '',
              topic: itemName || assignment.item_id || '',
              duration_hours: 0,
              outcome: 'completed',
              notes: `Completed ${assignment.item_type}`,
              signature: null,
            });
          }
        }
      }

      // Sort by date descending
      combinedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log("Combined logs count:", combinedLogs.length);
      setHistoryLogs(combinedLogs);
    } catch (e) {
      console.error("Failed to fetch training logs:", e);
      setHistoryLogs([]);
    } finally {
      setHistoryBusy(false);
    }
  };

  // Derived - All filtered data
  const allFiltered = useMemo(() => {
    return rows
      .filter((r) => (dept === "all" ? true : r.departmentId === dept))
      .filter((r) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          r.name.toLowerCase().includes(term) ||
          r.departmentName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, dept, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(allFiltered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = allFiltered.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dept, searchTerm]);

  // Handlers
  const openLog = async (u: UserRow) => {
    setOpenFor(u);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      durationHours: 1,
      outcome: "completed",
      notes: "",
      learnerSignature: "",
      trainerSignature: "",
    });
    const assignmentsFetch = await fetchAssignments(u.auth_id);
    await fetchDocumentAssignments(u.auth_id);

    // If there's a selected module, fetch tests/docs for it
    // This will be called again when module changes via useEffect below
  };

  // Watch for module selection changes and fetch associated tests/docs
  useEffect(() => {
    if (selectedModuleId && openFor) {
      console.log("⚡ Module changed to:", selectedModuleId, "- fetching tests and documents");
      fetchAssociatedTests(selectedModuleId);
      fetchAssociatedDocuments(selectedModuleId);
    }
  }, [selectedModuleId, openFor]);

  const handleLearnerSignatureChange = useCallback((dataUrl: string) => {
    setForm((f) => ({ ...f, learnerSignature: dataUrl }));
  }, []);

  const handleTrainerSignatureChange = useCallback((dataUrl: string) => {
    setForm((f) => ({ ...f, trainerSignature: dataUrl }));
  }, []);

  // Handler for certificates dialog
  const openCertificatesDialog = async (user: UserRow) => {
    setCertificatesDialog({
      open: true,
      user,
      modules: [],
      loading: true,
    });

    try {
      // Fetch completed module assignments for this user
      const { data: assignments, error: assignmentsError } = await supabase
        .from("user_assignments")
        .select("id, item_id, completed_at")
        .eq("auth_id", user.auth_id)
        .eq("item_type", "module")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setCertificatesDialog({
          open: true,
          user,
          modules: [],
          loading: false,
        });
        return;
      }

      // Fetch module names separately
      const moduleIds = assignments.map((a) => a.item_id);
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select("id, name")
        .in("id", moduleIds);

      if (modulesError) throw modulesError;

      // Create a map of module id to name
      const moduleMap = new Map(
        (modulesData || []).map((m) => [m.id, m.name])
      );

      const completedModules: CompletedModule[] = assignments.map((item) => ({
        module_id: item.item_id,
        module_name: moduleMap.get(item.item_id) || "Unknown Module",
        completed_at: new Date(item.completed_at).toLocaleDateString(),
        user_auth_id: user.auth_id,
        user_name: user.name,
      }));

      setCertificatesDialog({
        open: true,
        user,
        modules: completedModules,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching completed modules:", error);
      alert("Failed to load completed modules");
      setCertificatesDialog({
        open: false,
        user: null,
        modules: [],
        loading: false,
      });
    }
  };

  const submitLog = async () => {
    if (!openFor) return;
    if (!selectedModuleId) {
      alert("Please select a module.");
      return;
    }

    // Only require signatures for satisfactory completion
    if (form.outcome === "completed") {
      if (!form.learnerSignature.trim()) {
        alert("Please provide the learner's e-signature for satisfactory training completion.");
        return;
      }
      if (!form.trainerSignature.trim()) {
        alert("Please provide the trainer's e-signature for satisfactory training completion.");
        return;
      }
    }

    setBusy(true);
    try {
      const assignment = assignments.find(
        (a) => a.module_id === selectedModuleId,
      );

      console.log("=== TrainerView: Logging training completion ===");
      console.log("User auth_id:", openFor.auth_id);
      console.log("Module ID:", selectedModuleId);
      console.log("Assignment ID:", assignment?.id);

      // 1) Insert into training_logs directly (client-side)
      const { error: insertErr } = await supabase.from("training_logs").insert([
        {
          auth_id: openFor.auth_id, // 👈 use auth_id
          date: form.date,
          topic: selectedModuleId, // or assignment?.module_name
          duration_hours: Number(form.durationHours) || 1,
          outcome: form.outcome,
          notes: form.notes?.trim() || null,
          // Only include signatures for satisfactory completion
          signature: form.outcome === "completed" ? form.learnerSignature : null,
          trainer_signature: form.outcome === "completed" ? form.trainerSignature : null,
          // assignment_id: assignment?.id ?? null,               // uncomment if column exists
        },
      ]);

      if (insertErr) {
        console.error("❌ Insert training_logs failed:", insertErr);
        alert(`Failed to log training: ${insertErr.message}`);
        setBusy(false);
        return;
      }

      console.log("✅ Training log inserted successfully");

      // 2) Assign selected documents to the user
      if (selectedDocsToAssign.length > 0) {
        console.log("📄 Assigning documents:", selectedDocsToAssign);
        const docAssignments = selectedDocsToAssign.map(docId => ({
          auth_id: openFor.auth_id,
          item_id: docId,
          item_type: 'document',
          assigned_at: new Date().toISOString(),
          confirmation_required: true
        }));
        const { error: assignErr } = await supabase
          .from("user_assignments")
          .insert(docAssignments);

        if (assignErr) {
          console.error("❌ Failed to assign documents:", assignErr);
          alert(`Warning: Training logged but failed to assign documents: ${assignErr.message}`);
        } else {
          console.log("✅ Documents assigned successfully");
        }
      }

      // 3) Record completion or outcome using the proper API
      console.log("📚 Recording training outcome via API...");
      console.log("📅 Training date from form:", form.date);
      console.log("📊 Training outcome:", form.outcome);

      try {
        const payload = {
          auth_id: openFor.auth_id,
          item_id: selectedModuleId,
          item_type: 'module',
          completed_date: form.date, // Pass the actual training date
          training_outcome: form.outcome // Pass the outcome: completed, needs_improvement, or failed
        };
        console.log("🔍 Sending payload to API:", payload);

        const response = await fetch('/api/record-training-completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          console.error("❌ API error:", error);
          throw new Error(error.error || 'Failed to record training outcome');
        }

        const result = await response.json();
        console.log("✅ Training outcome recorded successfully:", result);

        // Show appropriate message based on outcome
        if (form.outcome === "completed") {
          console.log("✅ Training completed satisfactorily");
        } else if (form.outcome === "needs_improvement") {
          console.log("⚠️ Training requires improvement - assignment remains open");
        } else if (form.outcome === "failed") {
          console.log("❌ Training failed - assignment remains open for re-training");
        }
      } catch (apiError) {
        console.error("❌ Failed to record training outcome via API:", apiError);
        alert("Training logged but outcome may not be fully recorded. Please check the assignment status.");
      }

      // Refresh the user list if training was completed
      if (form.outcome === "completed") {
        await fetchData();
      }

      setOpenFor(null);
    } catch (e) {
      console.error("❌ Error in submitLog:", e);
      alert("Failed to log training.");
    } finally {
      setBusy(false);
    }
  };

  // ==========================
  // CSV Export/Import Functions
  // ==========================
  const downloadUserAssignmentsCSV = async () => {
    try {
      setBusy(true);

      // Fetch only incomplete user assignments (completed_at is NULL)
      const { data: userAssignments, error } = await supabase
        .from("user_assignments")
        .select(`
          id,
          auth_id,
          item_id,
          item_type,
          assigned_at,
          completed_at
        `)
        .is("completed_at", null)
        .order("assigned_at", { ascending: false });

      if (error) {
        console.error("Error fetching user assignments:", error);
        alert("Failed to fetch user assignments");
        return;
      }

      // Get user details
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, auth_id, first_name, last_name, email, department_id");

      if (usersError) {
        console.error("Error fetching users:", usersError);
      }

      // Get modules
      const { data: modulesList, error: modulesError } = await supabase
        .from("modules")
        .select("id, name");

      if (modulesError) {
        console.error("Error fetching modules:", modulesError);
      }

      // Get documents
      const { data: documents, error: documentsError } = await supabase
        .from("documents")
        .select("id, title");

      if (documentsError) {
        console.error("Error fetching documents:", documentsError);
      }

      // Create lookup maps
      const userMap = new Map(users?.map(u => [u.auth_id, u]) || []);
      const moduleMap = new Map(modulesList?.map(m => [m.id, m]) || []);
      const documentMap = new Map(documents?.map(d => [d.id, d]) || []);

      // Prepare CSV data
      const csvData = (userAssignments || []).map(assignment => {
        const user = userMap.get(assignment.auth_id);
        const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '';
        const userEmail = user?.email || '';
        
        let itemName = '';
        if (assignment.item_type === 'module') {
          itemName = moduleMap.get(assignment.item_id)?.name || `Module ${assignment.item_id}`;
        } else if (assignment.item_type === 'document') {
          itemName = documentMap.get(assignment.item_id)?.title || `Document ${assignment.item_id}`;
        }

        // Format dates as YYYY-MM-DD for consistency
        const formatDateYYYYMMDD = (dateString: string | null) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        return {
          assignment_id: assignment.id,
          user_auth_id: assignment.auth_id,
          user_name: userName,
          user_email: userEmail,
          item_type: assignment.item_type,
          item_id: assignment.item_id,
          item_name: itemName,
          assigned_at: formatDateYYYYMMDD(assignment.assigned_at),
          completed_at: formatDateYYYYMMDD(assignment.completed_at), // Fill this in to mark as complete (YYYY-MM-DD format)
        };
      });

      // Convert to CSV
      if (csvData.length === 0) {
        alert("No user assignments found to export");
        return;
      }

      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `user_assignments_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`Successfully exported ${csvData.length} user assignments to CSV`);

    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV");
    } finally {
      setBusy(false);
    }
  };

  // Helper function to parse CSV properly (handles quoted fields)
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const handleCSVUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      setBusy(true);
      setCsvUploading(true);
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file appears to be empty or invalid');
        return;
      }

      // Remove BOM if present and parse headers
      const firstLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
      const headers = parseCSVLine(firstLine).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const dataRows = lines.slice(1);

      console.log('Raw first line:', lines[0]);
      console.log('Parsed headers:', headers);

      // Validate headers - only assignment_id is required
      const requiredHeaders = ['assignment_id'];
      const optionalHeaders = ['user_auth_id', 'user_name', 'user_email', 'item_type', 'item_id', 'item_name', 'assigned_at', 'completed_at'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        alert(`Missing required headers: ${missingHeaders.join(', ')}`);
        return;
      }

      console.log('CSV Headers found:', headers);
      console.log('Processing', dataRows.length, 'data rows');

      // Check if completed_at column exists
      if (!headers.includes('completed_at')) {
        setCsvResultModal({
          open: true,
          success: 0,
          errors: 1,
          errorDetails: ['CSV is missing the "completed_at" column. Please ensure your CSV has this column header.'],
        });
        return;
      }

      const updates = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const row = parseCSVLine(dataRows[i]);
          const rowData: any = {};

          headers.forEach((header, index) => {
            rowData[header] = row[index]?.trim() || '';
          });

          console.log(`Row ${i + 1} data:`, rowData);

          // Process row if assignment_id exists
          if (!rowData.assignment_id || rowData.assignment_id === '') {
            console.log(`Row ${i + 1}: Skipped - no assignment_id`);
            continue;
          }

          const updateData: any = {};

          // Check for completed_at column value
          const dateValue = rowData.completed_at || '';

          if (dateValue && dateValue !== '') {
            // Parse date - support multiple formats
            let parsedDate: Date | null = null;

            // Format 1: YYYY-MM-DD or ISO timestamp
            const isoRegex = /^\d{4}-\d{2}-\d{2}/;
            if (isoRegex.test(dateValue)) {
              parsedDate = dateValue.includes('T')
                ? new Date(dateValue)
                : new Date(dateValue + 'T00:00:00Z');
            }
            // Format 2: DD/MM/YYYY (common UK/AU format)
            else {
              const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
              const match = dateValue.match(ddmmyyyyRegex);
              if (match) {
                const day = parseInt(match[1], 10);
                const month = parseInt(match[2], 10);
                const year = parseInt(match[3], 10);

                // Validate day and month ranges
                if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
                  // Create ISO date string (month is 0-indexed in Date constructor)
                  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00Z`;
                  parsedDate = new Date(isoString);
                } else {
                  errors.push(`Row ${i + 2}: Invalid date "${dateValue}". Day must be 1-31, month must be 1-12.`);
                  continue;
                }
              }
            }

            if (parsedDate && !isNaN(parsedDate.getTime())) {
              updateData.completed_at = parsedDate.toISOString();
              console.log(`Row ${i + 1}: Will update assignment ${rowData.assignment_id} with completed_at = ${updateData.completed_at}`);
            } else {
              errors.push(`Row ${i + 2}: Invalid date format "${dateValue}". Use YYYY-MM-DD or DD/MM/YYYY format.`);
              continue;
            }
          } else {
            // No date provided - skip this row silently
            console.log(`Row ${i + 1}: Skipped - no completed_at date provided`);
            continue;
          }

          if (Object.keys(updateData).length > 0) {
            updates.push({
              id: rowData.assignment_id,
              ...updateData
            });
          }
        } catch (rowError) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          errors.push(`Row ${i + 2}: Error parsing row - ${rowError}`);
        }
      }

      if (errors.length > 0) {
        setCsvResultModal({
          open: true,
          success: 0,
          errors: errors.length,
          errorDetails: errors,
        });
        return;
      }

      if (updates.length === 0) {
        alert('No rows with completed_at dates found to update');
        return;
      }

      console.log(`Found ${updates.length} valid updates to process`);
      console.log('Updates to apply:', updates);

      // Process updates in batches
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;
      const errorDetails: string[] = [];

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        for (const update of batch) {
          const { id, ...updateData } = update;
          console.log(`[CSV Import] Updating assignment ${id} with:`, updateData);

          const { data, error } = await supabase
            .from("user_assignments")
            .update(updateData)
            .eq("id", id)
            .select();

          if (error) {
            console.error(`[CSV Import] ❌ Error updating assignment ${id}:`, error);
            errorDetails.push(`${id.substring(0, 8)}: ${error.message}`);
            errorCount++;
          } else {
            console.log(`[CSV Import] ✅ Successfully updated assignment ${id}`, data);
            successCount++;
          }
        }
      }

      console.log(`[CSV Import] Final results: ${successCount} success, ${errorCount} errors`);

      // Refresh the user list to reflect completed assignments
      if (successCount > 0) {
        await fetchData();
      }

      // Show result modal
      setCsvResultModal({
        open: true,
        success: successCount,
        errors: errorCount,
        errorDetails: errorDetails,
      });

      // Clear the file input
      event.target.value = '';

    } catch (error) {
      console.error("Error processing CSV:", error);
      setCsvResultModal({
        open: true,
        success: 0,
        errors: 1,
        errorDetails: [`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      });
    } finally {
      setBusy(false);
      setCsvUploading(false);
    }
  };

  return (
    <>
      {/* CSV Upload Loading Overlay */}
      {csvUploading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '1.5rem'
          }}
        >
          <style jsx>{`
            @keyframes spin {
              from {
                transform: rotate(0deg);
              }
              to {
                transform: rotate(360deg);
              }
            }
            .spinning-logo {
              animation: spin 2s linear infinite;
            }
          `}</style>
          <Image
            src="/logo-turq-orange.png"
            alt="Loading"
            width={120}
            height={120}
            className="spinning-logo"
            unoptimized
          />
          <div style={{ color: 'var(--neon)', fontSize: '1.25rem', fontWeight: 600 }}>
            Processing CSV Upload...
          </div>
        </div>
      )}

      <TrainingMaterialsManagerDialog open={materialsDialogOpen} onClose={() => setMaterialsDialogOpen(false)} />
      <ContentHeader
        title="Trainer View"
        description="Record, assign, and review training for users"
      />

      {/* Training Management Toolbar */}
      <TrainerViewToolbar
        onManageMaterials={() => setMaterialsDialogOpen(true)}
        onManageQuestions={() => setSection(section === "questions" ? "log" : "questions")}
        onManageCategories={() => setCategoriesDialogOpen(true)}
        onDownloadCSV={downloadUserAssignmentsCSV}
        onUploadCSV={() => document.getElementById('csv-upload')?.click()}
        onSearch={setSearchTerm}
        onDepartmentFilter={setDept}
        departments={depts}
        selectedDepartment={dept}
        busy={busy}
      />

      {/* Hidden file input for CSV upload */}
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        style={{ display: 'none' }}
        onChange={handleCSVUpload}
      />

        {/* Table */}
        <NeonTable
          columns={[
            { header: "Name", accessor: "name" },
            { header: "Department", accessor: "departmentName" },
            {
              header: "Last Training",
              accessor: "lastTrainingDate",
              render: (v) => formatDate(v as string),
            },
            {
              header: "Actions",
              accessor: "actions",
              render: (_, row) => (
                <div className="flex items-center justify-center gap-2">
                  <TextIconButton
                    variant="addUser"
                    label="Log"
                    onClick={() => openLog(row as UserRow)}
                    title="Log a training session"
                  />
                  <TextIconButton
                    variant="clock"
                    label="History"
                    onClick={() => openHistory(row as UserRow)}
                    title="View training history"
                  />
                  <TextIconButton
                    variant="info"
                    label="Certs"
                    onClick={() => openCertificatesDialog(row as UserRow)}
                    title="View certificates & status"
                    icon={<FiAward />}
                  />
                </div>
              ),
            },
          ]}
          data={paginatedData}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-4">
            <div className="text-sm" style={{ color: 'var(--text-white)', opacity: 0.7 }}>
              Showing {startIndex + 1} to {Math.min(endIndex, allFiltered.length)} of {allFiltered.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="neon-btn neon-btn-utility neon-btn-global"
                title="First page"
              >
                ««
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="neon-btn neon-btn-utility neon-btn-global"
                title="Previous page"
              >
                «
              </button>
              <span className="text-sm px-4" style={{ color: 'var(--text-white)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="neon-btn neon-btn-utility neon-btn-global"
                title="Next page"
              >
                »
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="neon-btn neon-btn-utility neon-btn-global"
                title="Last page"
              >
                »»
              </button>
            </div>
          </div>
        )}

        {/* Log Training Session Dialog */}
        <OverlayDialog
          open={!!openFor}
          onClose={() => !busy && setOpenFor(null)}
          width={1000}
          showCloseButton
          closeOnOutsideClick={!busy}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden', margin: '-2rem', padding: '0' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)', padding: '2rem 2rem 0 2rem', flexShrink: 0 }}>
              Log Training - {openFor?.name} • {openFor?.departmentName}
            </h2>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
              <NeonForm
              title=""
              submitLabel={busy ? "Saving..." : "Save Log"}
              onSubmit={(e) => {
                e.preventDefault();
                submitLog();
              }}
            >
              <span className="font-body font-medium opacity-75 mb-2 block">
                Today: {new Date().toLocaleDateString()}
              </span>

              {/* Module Selection */}
              {assignments.length > 0 ? (
                <label className="grid gap-1">
                  <span className="text-base font-body font-medium opacity-80">Module</span>
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
                  <span className="text-base font-body font-medium opacity-80">Module</span>
                  <span className="font-body font-medium opacity-60">
                    No modules assigned.
                  </span>
                </label>
              )}

              {/* Date, Duration, and Outcome in a row */}
              <div className="grid grid-cols-3 gap-4">
                <label className="grid gap-1">
                  <span className="text-base font-body font-medium opacity-80">Date</span>
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
                  <span className="text-base font-body font-medium opacity-80">Duration (Hours)</span>
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

                <label className="grid gap-1">
                  <span className="text-base font-body font-medium opacity-80">Training Outcome</span>
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
                    <option value="completed">Completed - Satisfactory</option>
                    <option value="needs_improvement">Needs Improvement - Re-train Required</option>
                    <option value="failed">Failed - Must Re-train</option>
                  </select>
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px" }}>
                    {form.outcome === "completed" && "Training completed to satisfactory standard"}
                    {form.outcome === "needs_improvement" && "Training logged but requires additional practice"}
                    {form.outcome === "failed" && "Training not completed, immediate re-training needed"}
                  </div>
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-base font-body font-medium opacity-80">Notes</span>
                <textarea
                  rows={4}
                  className="neon-input"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  disabled={busy}
                  placeholder="Key points covered, observed competency, follow-up actions..."
                />
              </label>

              {/* Signature fields - only shown for satisfactory completion */}
              {form.outcome === "completed" && (
                <>
                  {/* Learner E-signature field */}
                  <div className="grid gap-2 mt-3">
                    <span className="text-base font-body font-medium opacity-80">
                      Learner E-Signature *
                    </span>
                    <SignatureBox
                      disabled={busy}
                      onChange={handleLearnerSignatureChange}
                    />
                    {form.learnerSignature && (
                      <div className="mt-1 bg-black/10 rounded p-2" style={{ maxWidth: '300px', maxHeight: '100px' }}>
                        <img
                          alt="Learner signature preview"
                          src={form.learnerSignature}
                          className="object-contain"
                          style={{ maxWidth: '100%', maxHeight: '96px', display: 'block' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Trainer E-signature field */}
                  <div className="grid gap-2 mt-3">
                    <span className="text-base font-body font-medium opacity-80">
                      Trainer E-Signature *
                    </span>
                    <SignatureBox
                      disabled={busy}
                      onChange={handleTrainerSignatureChange}
                    />
                    {form.trainerSignature && (
                      <div className="mt-1 bg-black/10 rounded p-2" style={{ maxWidth: '300px', maxHeight: '100px' }}>
                        <img
                          alt="Trainer signature preview"
                          src={form.trainerSignature}
                          className="object-contain"
                          style={{ maxWidth: '100%', maxHeight: '96px', display: 'block' }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Info message for unsatisfactory outcomes */}
              {(form.outcome === "needs_improvement" || form.outcome === "failed") && (
                <div style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "rgba(245, 158, 11, 0.1)",
                  borderLeft: "3px solid #f59e0b",
                  fontSize: "0.9rem",
                  lineHeight: "1.5"
                }}>
                  <strong>Note:</strong> Signatures are not required for unsatisfactory training outcomes.
                  This training session will be logged but the assignment will remain open for re-training.
                </div>
              )}

              {/* Associated Tests Section */}
              {associatedTests.length > 0 && (
                <div className="grid gap-1">
                  <span className="text-base font-body font-medium opacity-80">Associated Tests</span>
                  <div className="space-y-2">
                    {associatedTests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-opacity-20"
                        style={{ borderColor: 'var(--neon)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                      >
                        <span className="font-body font-medium text-sm flex-1">{test.title}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (openFor) {
                              setTestRunnerDialog({
                                open: true,
                                packId: test.id,
                                userId: openFor.auth_id,
                              });
                            }
                          }}
                          disabled={busy}
                          className="neon-btn neon-btn-next"
                          style={{ minWidth: '120px' }}
                        >
                          Take Test
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Documents Section */}
              {associatedDocuments.length > 0 && (
                <div className="grid gap-1">
                  <span className="text-base font-body font-medium opacity-80">Assign Documents for Confirmation</span>
                  <div className="space-y-2">
                    {associatedDocuments.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-opacity-20 cursor-pointer transition-opacity hover:opacity-90"
                        style={{ borderColor: 'var(--neon)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocsToAssign.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocsToAssign([...selectedDocsToAssign, doc.id]);
                            } else {
                              setSelectedDocsToAssign(selectedDocsToAssign.filter(id => id !== doc.id));
                            }
                          }}
                          disabled={busy}
                          className="w-4 h-4 flex-shrink-0"
                          style={{ accentColor: 'var(--neon)' }}
                        />
                        <span className="font-body font-medium text-sm">{doc.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Assignments Section */}
              <div className="grid gap-1 mt-6">
                <span className="text-base font-body font-medium opacity-80">
                  Document Assignments
                </span>
                {documentAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {documentAssignments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-opacity-30 bg-black bg-opacity-20"
                        style={{ borderColor: 'var(--neon)' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {doc.document_title || `Document ${doc.document_id}`}
                            </div>
                            {doc.reference_code && (
                              <div className="text-xs opacity-70 mt-1">
                                Ref: {doc.reference_code}
                              </div>
                            )}
                            <div className="text-xs opacity-60 mt-1">
                              Assigned: {new Date(doc.assigned_at).toLocaleDateString()}
                              {doc.due_at && ` • Due: ${new Date(doc.due_at).toLocaleDateString()}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.document_url && (
                              <a
                                href={doc.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                                title="View document"
                              >
                                View
                              </a>
                            )}
                            {doc.confirmation_required && !doc.confirmed_at && (
                              <button
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase
                                      .from("user_assignments")
                                      .update({ confirmed_at: new Date().toISOString() })
                                      .eq("id", doc.id);
                                    
                                    if (error) {
                                      console.error("Error confirming document:", error);
                                      alert("Failed to confirm document");
                                    } else {
                                      // Refresh document assignments
                                      if (openFor) {
                                        await fetchDocumentAssignments(openFor.auth_id);
                                      }
                                    }
                                  } catch (err) {
                                    console.error("Error confirming document:", err);
                                    alert("Failed to confirm document");
                                  }
                                }}
                                disabled={busy}
                                className="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                                title="Mark as confirmed"
                              >
                                Confirm
                              </button>
                            )}
                            {doc.confirmation_required && doc.confirmed_at && (
                              <div className="text-xs px-2 py-1 rounded bg-green-600 text-white">
                                Confirmed
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="font-body font-medium opacity-60 text-sm">
                    No document assignments.
                  </span>
                )}
              </div>
            </NeonForm>
            </div>
          </div>
        </OverlayDialog>

        {/* History Modal */}
        <OverlayDialog
          open={!!historyFor}
          onClose={() => setHistoryFor(null)}
          width={1000}
          showCloseButton
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden', margin: '-2rem', padding: '0' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)', padding: '2rem 2rem 0 2rem', flexShrink: 0 }}>
              Training History - {historyFor?.name}
            </h2>
            <div style={{ flex: 1, minHeight: '400px', overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
              {historyBusy ? (
                <div className="text-center py-8 opacity-70">Loading...</div>
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
            </div>
          </div>
        </OverlayDialog>

        {/* Training Questions Section */}
        {section === "questions" && (
          <div style={{ margin: 24 }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)' }}>
              Training Questions
            </h2>
            <TrainingQuestionCategoriesTable />
          </div>
        )}

        {/* Training Categories Dialog Overlay */}
        {categoriesDialogOpen && (
          <div className="ui-dialog-overlay" onClick={() => setCategoriesDialogOpen(false)}>
            <div className="ui-dialog-content" onClick={e => e.stopPropagation()}>
              <NeonPanel>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)' }}>
                  Training Categories
                </h2>
                <TrainingQuestionCategory />
                <CustomTooltip text="Close categories dialog">
                  <button
                    className="neon-btn neon-btn-close"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setCategoriesDialogOpen(false)}
                  >
                    <FiX />
                  </button>
                </CustomTooltip>
              </NeonPanel>
            </div>
          </div>
        )}

        {/* CSV Import Result Modal */}
        <OverlayDialog
          open={csvResultModal.open}
          onClose={() => setCsvResultModal({ ...csvResultModal, open: false })}
          width={700}
          showCloseButton
        >
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)' }}>
            CSV Import Results
          </h2>

          <div className="space-y-4">
            {/* Success Count */}
            {csvResultModal.success > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#14532d', border: '1px solid #16a34a' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <div>
                  <div className="font-semibold" style={{ color: '#22c55e' }}>
                    {csvResultModal.success} assignment{csvResultModal.success !== 1 ? 's' : ''} updated successfully
                  </div>
                </div>
              </div>
            )}

            {/* Error Count */}
            {csvResultModal.errors > 0 && (
              <div className="p-3 rounded-lg" style={{ background: '#7f1d1d', border: '1px solid #dc2626' }}>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ fontSize: '24px' }}>❌</span>
                  <div className="font-semibold" style={{ color: '#ef4444' }}>
                    {csvResultModal.errors} error{csvResultModal.errors !== 1 ? 's' : ''} occurred
                  </div>
                </div>
                {csvResultModal.errorDetails.length > 0 && (
                  <div className="ml-10 mt-2 space-y-1">
                    {csvResultModal.errorDetails.slice(0, 5).map((error, idx) => (
                      <div key={idx} className="text-sm opacity-90" style={{ color: '#fca5a5' }}>
                        • {error}
                      </div>
                    ))}
                    {csvResultModal.errorDetails.length > 5 && (
                      <div className="text-sm opacity-75 italic" style={{ color: '#fca5a5' }}>
                        ...and {csvResultModal.errorDetails.length - 5} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </OverlayDialog>

        {/* Certificates Dialog */}
        <OverlayDialog
          open={certificatesDialog.open}
          onClose={() => setCertificatesDialog({ ...certificatesDialog, open: false })}
          width={1000}
          showCloseButton
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden', margin: '-2rem', padding: '0' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--neon)', padding: '2rem 2rem 0 2rem', flexShrink: 0 }}>
              Certificates - {certificatesDialog.user?.name}
            </h2>
            <div style={{ flex: 1, minHeight: '400px', overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
              {certificatesDialog.loading ? (
                <div className="text-center py-8 opacity-70">Loading...</div>
              ) : certificatesDialog.modules.length === 0 ? (
                <div className="text-center py-8 opacity-70">No completed modules found</div>
              ) : (
                <NeonTable
                  columns={[
                    { header: "Module", accessor: "module_name" },
                    { header: "Completed", accessor: "completed_at" },
                    {
                      header: "Actions",
                      accessor: "actions",
                      render: (_, row) => {
                        const module = row as CompletedModule;
                        return (
                          <div className="flex items-center justify-center gap-2">
                            <TextIconButton
                              variant="download"
                              label="Download"
                              onClick={() => {
                                // TODO: Implement certificate download
                                console.log("Download certificate for:", module);
                                alert(`Download certificate for ${module.module_name}`);
                              }}
                              title="Download certificate"
                            />
                            <TextIconButton
                              variant="send"
                              label="Send"
                              onClick={() => {
                                // TODO: Implement certificate send
                                console.log("Send certificate for:", module);
                                alert(`Send certificate for ${module.module_name}`);
                              }}
                              title="Send certificate via email"
                            />
                          </div>
                        );
                      },
                    },
                  ]}
                  data={certificatesDialog.modules}
                />
              )}
            </div>
          </div>
        </OverlayDialog>

        {/* Test Runner Dialog */}
        <OverlayDialog
          open={testRunnerDialog.open}
          onClose={() => setTestRunnerDialog({ open: false, packId: null, userId: null })}
          width={1000}
          showCloseButton
        >
          <div className="ui-dialog-container">
            <div className="ui-dialog-scrollable">
              {testRunnerDialog.packId && testRunnerDialog.userId && (
                <TestRunner
                  rpcMode="simple"
                  testingUserId={testRunnerDialog.userId}
                  packIds={[testRunnerDialog.packId]}
                  onReturnToLog={() => setTestRunnerDialog({ open: false, packId: null, userId: null })}
                />
              )}
            </div>
          </div>
        </OverlayDialog>
    </>
  );
}
