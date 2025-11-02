"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  FiUserPlus,
  FiClock,
  FiArchive,
  FiAward,
  FiFilter,
  FiAlertOctagon,
  FiCheckSquare,
  FiActivity,
  FiDownload,
  FiUpload,
  FiHelpCircle,
  FiX,
} from "react-icons/fi";
import { createClient } from "@supabase/supabase-js";
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
      width: 500,
      height: 200,
      className:
        "w-full max-w-[500px] h-[200px] rounded-lg bg-[var(--field,#012b2b)] shrink-0 touch-none block neon-panel",
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
        velocityFilterWeight={0.7}
        minWidth={0.5}
        maxWidth={2.5}
        dotSize={1}
        throttle={8}
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
  const [csvResultModal, setCsvResultModal] = useState<{
    open: boolean;
    success: number;
    errors: number;
    errorDetails: string[];
    skipped: number;
    skippedDetails: string[];
  }>({
    open: false,
    success: 0,
    errors: 0,
    errorDetails: [],
    skipped: 0,
    skippedDetails: [],
  });

  useEffect(() => {
    async function fetchData() {
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
          signature: form.signature,
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

      // 2) Record completion using the proper API (handles follow-up dates, permanent records, etc.)
      if (form.outcome === "completed") {
        console.log("📚 Recording training completion via API...");
        console.log("📅 Training date from form:", form.date);
        try {
          const response = await fetch('/api/record-training-completion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              auth_id: openFor.auth_id,
              item_id: selectedModuleId,
              item_type: 'module',
              completed_date: form.date // Pass the actual training date for follow-up calculation
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("❌ API error:", error);
            throw new Error(error.error || 'Failed to record completion');
          }

          const result = await response.json();
          console.log("✅ Completion recorded successfully:", result);
        } catch (apiError) {
          console.error("❌ Failed to record completion via API:", apiError);
          alert("Training logged but completion may not be fully recorded. Please check the assignment status.");
        }
      } else {
        console.log("ℹ️ Outcome is 'needs-followup', not marking as completed");
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
      
      // Fetch all user assignments with user and module/document details
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
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV file appears to be empty or invalid');
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim());
      const dataRows = lines.slice(1);

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
          skipped: 0,
          skippedDetails: [],
        });
        return;
      }

      const updates = [];
      const errors = [];
      const skippedRows = [];

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
            skippedRows.push(`Row ${i + 2}: Missing assignment_id`);
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
            // No date provided - skip this row but don't count as error
            skippedRows.push(`Row ${i + 2}: No completed_at date provided (assignment_id: ${rowData.assignment_id})`);
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
          skipped: skippedRows.length,
          skippedDetails: skippedRows,
        });
        return;
      }

      if (updates.length === 0) {
        setCsvResultModal({
          open: true,
          success: 0,
          errors: 0,
          errorDetails: [],
          skipped: skippedRows.length,
          skippedDetails: skippedRows,
        });
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

      // Show result modal
      setCsvResultModal({
        open: true,
        success: successCount,
        errors: errorCount,
        errorDetails: errorDetails,
        skipped: skippedRows.length,
        skippedDetails: skippedRows,
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
        skipped: 0,
        skippedDetails: [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TrainingMaterialsManagerDialog open={materialsDialogOpen} onClose={() => setMaterialsDialogOpen(false)} />
      <ContentHeader
        title="Trainer View"
        description="Record, assign, and review training for users"
      />
        {/* Training Management Actions */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <CustomTooltip text="Manage training materials">
            <button
              className="neon-btn neon-btn-archive"
              onClick={() => setMaterialsDialogOpen(true)}
            >
              <FiArchive />
            </button>
          </CustomTooltip>
          <CustomTooltip text="Manage training questions">
            <button
              className="neon-btn neon-btn-edit"
              onClick={() => setSection(section === "questions" ? "log" : "questions")}
            >
              <FiHelpCircle />
            </button>
          </CustomTooltip>
          <CustomTooltip text="Manage question categories">
            <button
              className="neon-btn neon-btn-view"
              onClick={() => setCategoriesDialogOpen(true)}
            >
              <FiCheckSquare />
            </button>
          </CustomTooltip>
          <CustomTooltip text="Download user assignments as CSV">
            <button
              className="neon-btn neon-btn-save"
              onClick={downloadUserAssignmentsCSV}
              disabled={busy}
            >
              <FiDownload />
            </button>
          </CustomTooltip>
          <CustomTooltip text="Upload user assignments CSV">
            <button
              className="neon-btn neon-btn-upload"
              onClick={() => document.getElementById('csv-upload')?.click()}
              disabled={busy}
            >
              <FiUpload />
            </button>
          </CustomTooltip>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleCSVUpload}
          />
        </div>

        {/* Controls */}
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <label className="flex items-center gap-2 rounded-xl bg-[var(--field,#012b2b)] px-3 py-2 neon-panel">
            <FiFilter aria-hidden />
            <select
              aria-label="Filter by department"
              style={{ 
                width: '100%', 
                background: 'transparent', 
                outline: 'none',
                border: 'none',
                color: 'var(--text-white)'
              }}
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
            style={{ alignItems: 'flex-start', paddingTop: '2rem', paddingBottom: '2rem', overflowY: 'auto' }}
          >
            <div
              className="ui-dialog-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: 'calc(100vh - 4rem)', overflowY: 'auto', margin: 'auto' }}
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
                      width={500}
                      height={200}
                      className="mt-1 w-full max-w-[500px] h-[200px] object-contain bg-black/10 rounded"
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
                    className="neon-btn neon-btn-close"
                    style={{ marginTop: "1rem" }}
                    onClick={() => setHistoryFor(null)}
                  >
                    <FiX />
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
        {csvResultModal.open && (
          <div className="ui-dialog-overlay" onClick={() => setCsvResultModal({ ...csvResultModal, open: false })}>
            <div className="ui-dialog-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
              <NeonPanel>
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

                  {/* Skipped Count */}
                  {csvResultModal.skipped > 0 && (
                    <div className="p-3 rounded-lg" style={{ background: '#422006', border: '1px solid #f59e0b' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <span style={{ fontSize: '24px' }}>⏭️</span>
                        <div className="font-semibold" style={{ color: '#fbbf24' }}>
                          {csvResultModal.skipped} row{csvResultModal.skipped !== 1 ? 's' : ''} skipped
                        </div>
                      </div>
                      {csvResultModal.skippedDetails.length > 0 && (
                        <div className="ml-10 mt-2 space-y-1">
                          {csvResultModal.skippedDetails.slice(0, 5).map((skip, idx) => (
                            <div key={idx} className="text-sm opacity-90" style={{ color: '#fcd34d' }}>
                              • {skip}
                            </div>
                          ))}
                          {csvResultModal.skippedDetails.length > 5 && (
                            <div className="text-sm opacity-75 italic" style={{ color: '#fcd34d' }}>
                              ...and {csvResultModal.skippedDetails.length - 5} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <CustomTooltip text="Close results">
                  <button
                    className="neon-btn neon-btn-close"
                    style={{ marginTop: "1.5rem" }}
                    onClick={() => setCsvResultModal({ ...csvResultModal, open: false })}
                  >
                    <FiX />
                  </button>
                </CustomTooltip>
              </NeonPanel>
            </div>
          </div>
        )}
    </>
  );
}
