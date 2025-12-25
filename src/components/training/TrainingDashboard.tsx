"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp, FiRefreshCw, FiDownload, FiX, FiBook, FiFileText, FiClipboard, FiGrid, FiAward } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import SignaturePad from "react-signature-canvas";
import NeonForm from "@/components/NeonForm";
import TestRunner from "@/components/training/TestRunner";
import TrainingTestResults from "@/components/training/TrainingTestResults";
import TrainingMatrix from "@/components/training/TrainingMatrix";
import SuccessModal from "@/components/ui/SuccessModal";
import { openCertificateWindow } from "@/components/training/TrainingCertificate";
import TrainingRecord from "@/components/training/TrainingRecord";
import TrainingDocumentConfirmation, { DocumentConfirmationData } from "@/components/training/TrainingDocumentConfirmation";

/* ===========================
   TRAINING DASHBOARD
   Overview of training compliance for trainers
=========================== */

// Trim transparent edges from a canvas
function trimCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = src.getContext("2d");
  if (!ctx) return src;

  const { width, height } = src;
  const { data } = ctx.getImageData(0, 0, width, height);

  let top = 0, left = 0, right = width - 1, bottom = height - 1;
  let found = false;

  const rowHasInk = (y: number) => {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] !== 0) return true;
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

// SignatureBox component
type SignatureBoxProps = {
  disabled?: boolean;
  onChange: (dataUrl: string) => void;
};

const SignatureBox = React.memo(function SignatureBox({
  disabled,
  onChange,
}: SignatureBoxProps) {
  const padRef = useRef<SignaturePad>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const canvasProps = useMemo(
    () => ({
      className: "neon-panel",
      style: {
        width: '100%',
        height: '200px',
        borderRadius: '8px',
        backgroundColor: 'var(--field,#012b2b)',
        flexShrink: 0,
        touchAction: 'none',
        display: 'block',
      },
    }),
    [],
  );

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
    const trimmed = trimCanvas(canvas);
    onChange(trimmed.toDataURL("image/png"));
  }, [onChange]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    onChange("");
  }, [onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.7, fontSize: '0.875rem' }}>Draw your signature in the area below</div>
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

interface ComplianceStats {
  totalUsers: number;
  totalAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
  complianceRate: number;
}

interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  totalUsers: number;
  totalAssignments: number;
  completedAssignments: number;
  incompleteAssignments: number;
  upcomingRefreshDue: number;
  complianceRate: number;
}

interface TrainingItemStats {
  itemId: string;
  itemName: string;
  itemType: 'module' | 'document';
  totalAssignments: number;
  completedAssignments: number;
  complianceRate: number;
}

interface RecentActivity {
  userName: string;
  empNumber: string;
  department: string;
  moduleName: string;
  completedAt: string;
  type: 'completion' | 'assignment';
}

interface UserDetail {
  id: string;
  authId: string;
  name: string;
  empNumber: string;
  department: string;
  totalAssignments: number;
  completedAssignments: number;
  complianceRate: number;
}

interface AssignmentDetail {
  id: string;
  authId?: string;
  userName: string;
  userEmail: string;
  empNumber: string;
  moduleName: string;
  moduleId?: string;
  itemType?: 'module' | 'document';
  assignedAt: string;
  completedAt?: string;
  status: string;
}

interface FollowUpDetail {
  id: string;
  userName: string;
  moduleName: string;
  itemType?: 'module' | 'document';
  dueDate: string;
  completedAt?: string;
  status: string;
}

export default function TrainingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to fetch ALL records using pagination
  const fetchAllUserAssignments = async (additionalFilters: any = {}) => {
    let allAssignments: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('user_assignments')
        .select(`
          id,
          auth_id,
          item_id,
          item_type,
          completed_at,
          assigned_at,
          follow_up_assessment_required,
          follow_up_assessment_due_date,
          follow_up_assessment_completed_at
        `)
        .in('item_type', ['module', 'document'])
        .range(from, from + batchSize - 1);

      // Apply additional filters if provided
      Object.keys(additionalFilters).forEach(key => {
        const value = additionalFilters[key];
        if (key === 'auth_ids' && Array.isArray(value)) {
          query = query.in('auth_id', value);
        } else if (key === 'auth_id' && typeof value === 'string') {
          query = query.eq('auth_id', value);
        } else if (key === 'completed_only') {
          query = query.not('completed_at', 'is', null);
        } else if (key === 'incomplete_only') {
          query = query.is('completed_at', null);
        } else if (key === 'follow_up_required') {
          query = query.eq('follow_up_assessment_required', true)
                       .not('follow_up_assessment_due_date', 'is', null);
        }
      });

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        allAssignments = [...allAssignments, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }

    console.log(`Fetched ${allAssignments.length} total assignments using pagination`);
    return allAssignments;
  };
  const [complianceStats, setComplianceStats] = useState<ComplianceStats>({
    totalUsers: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    overdueAssignments: 0,
    upcomingFollowUps: 0,
    overdueFollowUps: 0,
    complianceRate: 0,
  });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [trainingItemStats, setTrainingItemStats] = useState<TrainingItemStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<UserDetail[] | AssignmentDetail[] | FollowUpDetail[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [incompleteSearchQuery, setIncompleteSearchQuery] = useState('');
  const [usersSearchQuery, setUsersSearchQuery] = useState('');
  const [showDownloadFormatDialog, setShowDownloadFormatDialog] = useState(false);
  const [showTrainingRecordDialog, setShowTrainingRecordDialog] = useState(false);

  // Department dialog states
  const [selectedDepartment, setSelectedDepartment] = useState<{ id: string; name: string } | null>(null);
  const [departmentDialogType, setDepartmentDialogType] = useState<'users' | 'assignments' | 'completed' | 'incomplete' | 'upcoming-refresh' | null>(null);

  // Log Training Dialog states
  const [logTrainingOpen, setLogTrainingOpen] = useState(false);
  const [logTrainingData, setLogTrainingData] = useState<{
    assignmentId: string;
    authId: string;
    userId: string;  // Internal user ID for test submissions
    userName: string;
    moduleId: string;
    moduleName: string;
  } | null>(null);

  // Document Confirmation Dialog state
  const [documentConfirmationData, setDocumentConfirmationData] = useState<DocumentConfirmationData | null>(null);
  const [logForm, setLogForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5), // HH:MM format
    durationHours: '1',
    outcome: 'completed' as 'completed' | 'needs_improvement' | 'failed',
    notes: '',
    learnerSignature: '',
    trainerSignature: '',
    translatorSignature: '',
    translationRequired: 'no' as 'yes' | 'no',
    translationLanguage: '',
    translatorName: ''
  });
  const [logBusy, setLogBusy] = useState(false);
  const [languageSuggestions, setLanguageSuggestions] = useState<string[]>([]);
  const [showLanguageSuggestions, setShowLanguageSuggestions] = useState(false);
  const [documentConfirmations, setDocumentConfirmations] = useState<Record<string, boolean>>({});

  const learnerPadRef = useRef<SignaturePad>(null);
  const trainerPadRef = useRef<SignaturePad>(null);

  // Common languages for autocomplete
  const commonLanguages = [
    'Spanish', 'Mandarin', 'French', 'German', 'Portuguese', 'Arabic',
    'Japanese', 'Korean', 'Vietnamese', 'Tagalog', 'Russian', 'Italian',
    'Polish', 'Turkish', 'Dutch', 'Swedish', 'Greek', 'Czech', 'Finnish',
    'Hungarian', 'Romanian', 'Thai', 'Indonesian', 'Malay', 'Hindi',
    'Bengali', 'Urdu', 'Punjabi', 'Tamil', 'Telugu', 'Cantonese', 'Wu'
  ];

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

  // Associated tests state
  const [associatedTests, setAssociatedTests] = useState<Array<{
    id: string;
    title: string;
    passedAttempt?: { score: number; completedAt: string } | null;
  }>>([]);

  // Associated documents state
  const [associatedDocuments, setAssociatedDocuments] = useState<Array<{
    id: string;
    title: string;
    reference_code: string;
    file_url?: string | null;
  }>>([]);

  // Test Results Viewer state
  const [showTestResults, setShowTestResults] = useState(false);

  // Training Matrix viewer state
  const [showTrainingMatrix, setShowTrainingMatrix] = useState(false);

  // Modules and Documents viewer state
  const [showModulesDialog, setShowModulesDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [modulesData, setModulesData] = useState<any[]>([]);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [modulesSearch, setModulesSearch] = useState('');
  const [documentsSearch, setDocumentsSearch] = useState('');
  const [modulesLoading, setModulesLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Success modal state
  const [successModal, setSuccessModal] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: '',
  });

  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching training compliance data...');

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_id, first_name, last_name, department_id, employee_number');

      if (usersError) throw usersError;

      // Use RPC function to get assignment stats (bypasses RLS for accurate counts)
      const { data: assignmentStatsData, error: statsError } = await supabase.rpc('get_user_assignment_stats');

      console.log('RPC assignmentStatsData:', assignmentStatsData);

      // Fetch all user assignments for additional details (follow-ups, etc.) using pagination
      const assignmentsData = await fetchAllUserAssignments();

      console.log('assignmentsData count:', assignmentsData?.length || 0);

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name', { ascending: true });

      if (departmentsError) throw departmentsError;

      // Fetch modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('id, name')
        .order('name', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('id, title')
        .order('title', { ascending: true });

      if (documentsError) throw documentsError;

      // Use RPC stats for accurate counts, fallback to assignmentsData if RPC fails
      const statsMap = new Map<string, { total: number; completed: number }>(
        assignmentStatsData?.map((s: any) => [s.auth_id, { total: Number(s.total), completed: Number(s.completed) }]) || []
      );

      // Calculate overall compliance stats - use direct query for accuracy
      // The RPC function can sometimes have caching or aggregation issues
      const totalAssignments = assignmentsData?.length || 0;
      const completedAssignments = assignmentsData?.filter(a => a.completed_at)?.length || 0;
      const overdueAssignments = totalAssignments - completedAssignments;

      console.log(`Direct Query Stats - Total: ${totalAssignments}, Completed: ${completedAssignments}, Incomplete: ${overdueAssignments}`);

      const followUpRequired = assignmentsData?.filter(a => a.follow_up_assessment_required && a.follow_up_assessment_due_date) || [];
      const today = new Date();
      const upcomingFollowUps = followUpRequired.filter(a => {
        if (a.follow_up_assessment_completed_at) return false;
        const dueDate = new Date(a.follow_up_assessment_due_date);
        return dueDate > today;
      }).length;
      const overdueFollowUps = followUpRequired.filter(a => {
        if (a.follow_up_assessment_completed_at) return false;
        const dueDate = new Date(a.follow_up_assessment_due_date);
        return dueDate <= today;
      }).length;

      setComplianceStats({
        totalUsers: usersData?.length || 0,
        totalAssignments,
        completedAssignments,
        overdueAssignments,
        upcomingFollowUps,
        overdueFollowUps,
        complianceRate: totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0,
      });

      // Calculate department stats using RPC data
      const deptMap = new Map(departmentsData?.map(d => [d.id, d.name]) || []);

      // Build a map of upcoming follow-up assessments by user (within next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const upcomingRefreshByUser = new Map<string, number>();
      assignmentsData?.forEach(assignment => {
        if (assignment.follow_up_assessment_required &&
            assignment.follow_up_assessment_due_date &&
            !assignment.follow_up_assessment_completed_at) {
          const dueDate = new Date(assignment.follow_up_assessment_due_date);
          if (dueDate > today && dueDate <= thirtyDaysFromNow) {
            const count = upcomingRefreshByUser.get(assignment.auth_id) || 0;
            upcomingRefreshByUser.set(assignment.auth_id, count + 1);
          }
        }
      });

      const deptStatsMap = new Map<string, DepartmentStats>();

      // Aggregate user stats by department
      usersData?.forEach(user => {
        const deptId = user.department_id;
        if (!deptId) return;

        const userStats: { total: number; completed: number } = statsMap.get(user.auth_id) || { total: 0, completed: 0 };
        const userUpcomingRefresh = upcomingRefreshByUser.get(user.auth_id) || 0;
        const deptName = deptMap.get(deptId) || 'Unknown Department';

        if (!deptStatsMap.has(deptId)) {
          deptStatsMap.set(deptId, {
            departmentId: deptId,
            departmentName: deptName,
            totalUsers: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            incompleteAssignments: 0,
            upcomingRefreshDue: 0,
            complianceRate: 0,
          });
        }

        const deptStats = deptStatsMap.get(deptId)!;
        deptStats.totalUsers++;
        deptStats.totalAssignments += userStats.total;
        deptStats.completedAssignments += userStats.completed;
        deptStats.incompleteAssignments += (userStats.total - userStats.completed);
        deptStats.upcomingRefreshDue += userUpcomingRefresh;
      });

      // Calculate compliance rates based on total assignments
      deptStatsMap.forEach(stats => {
        stats.complianceRate = stats.totalAssignments > 0
          ? (stats.completedAssignments / stats.totalAssignments) * 100
          : 0;

        console.log(`Department ${stats.departmentName}: Compliance = ${stats.complianceRate.toFixed(1)}% (${stats.completedAssignments}/${stats.totalAssignments}), Incomplete = ${stats.incompleteAssignments}, Upcoming Refresh = ${stats.upcomingRefreshDue}`);
      });

      setDepartmentStats(Array.from(deptStatsMap.values()).sort((a, b) => b.complianceRate - a.complianceRate));

      // Calculate training item stats (modules and documents)
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
      const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);
      const itemStatsMap = new Map<string, TrainingItemStats>();

      assignmentsData?.forEach(assignment => {
        const itemId = assignment.item_id;
        const itemType = assignment.item_type;
        const itemName = itemType === 'module'
          ? moduleMap.get(itemId) || 'Unknown Module'
          : documentMap.get(itemId) || 'Unknown Document';

        // Create unique key combining item_id and item_type
        const itemKey = `${itemType}:${itemId}`;

        if (!itemStatsMap.has(itemKey)) {
          itemStatsMap.set(itemKey, {
            itemId,
            itemName,
            itemType: itemType as 'module' | 'document',
            totalAssignments: 0,
            completedAssignments: 0,
            complianceRate: 0,
          });
        }

        const stats = itemStatsMap.get(itemKey)!;
        stats.totalAssignments++;
        if (assignment.completed_at) {
          stats.completedAssignments++;
        }
      });

      // Calculate compliance rates for training items
      itemStatsMap.forEach(stats => {
        stats.complianceRate = stats.totalAssignments > 0
          ? (stats.completedAssignments / stats.totalAssignments) * 100
          : 0;
      });

      setTrainingItemStats(Array.from(itemStatsMap.values()).sort((a, b) => a.complianceRate - b.complianceRate).slice(0, 10));

      // Fetch recent training logs (last 10 completions with actual training date/time)
      const { data: trainingLogsData, error: logsError } = await supabase
        .from('training_logs')
        .select('auth_id, topic, date, time, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logsError) {
        console.warn('Error fetching training logs:', logsError);
      }

      const userDetailsMap = new Map(usersData?.map(u => [u.auth_id, {
        name: `${u.first_name} ${u.last_name}`,
        empNumber: u.employee_number || 'N/A',
        departmentId: u.department_id
      }]) || []);

      const activity: RecentActivity[] = (trainingLogsData || []).map(log => {
        const userDetails = userDetailsMap.get(log.auth_id);
        const deptName = userDetails?.departmentId ? deptMap.get(userDetails.departmentId) : undefined;

        // Combine date and time into a single timestamp
        const trainingDateTime = log.time
          ? `${log.date}T${log.time}`
          : log.date;

        return {
          userName: userDetails?.name || 'Unknown User',
          empNumber: userDetails?.empNumber || 'N/A',
          department: deptName || 'N/A',
          moduleName: moduleMap.get(log.topic) || 'Unknown Module',
          completedAt: trainingDateTime,
          type: 'completion' as const,
        };
      });

      setRecentActivity(activity);
      setLastUpdated(new Date());

      console.log('Compliance data loaded successfully');
    } catch (err) {
      console.error('Error fetching compliance data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplianceData();

    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(fetchComplianceData, 60000); // Refresh every minute
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const fetchUsersDetail = async () => {
    setDialogLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_id, first_name, last_name, employee_number, department_id, departments(name)');

      if (usersError) throw usersError;

      console.log('Fetching assignments for', usersData?.length, 'users...');

      // Use RPC call to get accurate counts bypassing RLS
      // This uses a database function that runs with definer security
      const { data: assignmentStats, error: statsError } = await supabase.rpc('get_user_assignment_stats');

      if (statsError) {
        console.warn('RPC function not available, falling back to client-side aggregation:', statsError);

        // Fallback: Fetch all assignments with .in() filter for user auth_ids
        const authIds = usersData?.map(u => u.auth_id) || [];
        const assignmentsData = await fetchAllUserAssignments({ auth_ids: authIds });

        console.log('Total assignments fetched via .in() (modules + documents):', assignmentsData?.length);

        const assignmentsByUser = new Map<string, { total: number; completed: number }>();
        assignmentsData?.forEach(a => {
          if (!assignmentsByUser.has(a.auth_id)) {
            assignmentsByUser.set(a.auth_id, { total: 0, completed: 0 });
          }
          const stats = assignmentsByUser.get(a.auth_id)!;
          stats.total++;
          if (a.completed_at) stats.completed++;
        });

        const details: UserDetail[] = usersData?.map(u => {
          const stats = assignmentsByUser.get(u.auth_id) || { total: 0, completed: 0 };
          return {
            id: u.id,
            authId: u.auth_id,
            name: `${u.first_name} ${u.last_name}`,
            empNumber: u.employee_number || 'N/A',
            department: (u.departments as any)?.name || 'N/A',
            totalAssignments: stats.total,
            completedAssignments: stats.completed,
            complianceRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          };
        }) || [];

        setDialogData(details);
      } else {
        // Use RPC results
        const statsMap = new Map(assignmentStats.map((s: any) => [s.auth_id, s]));

        const details: UserDetail[] = usersData?.map(u => {
          const stats: any = statsMap.get(u.auth_id) || { total: 0, completed: 0 };
          return {
            id: u.id,
            authId: u.auth_id,
            name: `${u.first_name} ${u.last_name}`,
            empNumber: u.employee_number || 'N/A',
            department: (u.departments as any)?.name || 'N/A',
            totalAssignments: stats.total || 0,
            completedAssignments: stats.completed || 0,
            complianceRate: stats.total > 0 ? ((stats.completed || 0) / stats.total) * 100 : 0,
          };
        }) || [];

        setDialogData(details);
      }
    } catch (err) {
      console.error('Error fetching users detail:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const fetchAssignmentsDetail = async (type: 'completed' | 'incomplete') => {
    setDialogLoading(true);
    try {
      // Fetch ALL assignments using pagination
      const allAssignments = await fetchAllUserAssignments();

      console.log(`Total assignments fetched from DB: ${allAssignments?.length || 0}`);

      // Filter client-side
      const filtered = type === 'completed'
        ? allAssignments?.filter(a => a.completed_at)
        : allAssignments?.filter(a => !a.completed_at);

      console.log(`Filtered to ${type}: ${filtered?.length || 0}`);

      // Fetch all users to map details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, email, employee_number');

      if (usersError) throw usersError;

      // Debug: Check for employee 2277
      const emp2277Filtered = filtered?.filter(a => {
        const user = usersData?.find(u => u.auth_id === a.auth_id);
        return user?.employee_number === '2277';
      }) || [];

      if (emp2277Filtered.length > 0) {
        console.log(`Employee 2277 found - ${emp2277Filtered.length} ${type} assignment(s):`, emp2277Filtered);
      } else {
        console.log(`Employee 2277 NOT found in ${type} assignments`);
      }

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, name');

      const { data: documentsData } = await supabase
        .from('documents')
        .select('id, title');

      const userMap = new Map(usersData?.map(u => [u.auth_id, u]) || []);
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
      const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);

      const details: AssignmentDetail[] = filtered?.map(a => {
        const user = userMap.get(a.auth_id);
        const itemName = a.item_type === 'module'
          ? moduleMap.get(a.item_id) || 'Unknown Module'
          : documentMap.get(a.item_id) || 'Unknown Document';

        // Properly construct user name, handling null/undefined/empty values
        let userName = 'Unknown';
        if (user) {
          const firstName = (user.first_name || '').trim();
          const lastName = (user.last_name || '').trim();
          userName = [firstName, lastName].filter(n => n).join(' ') || 'Unknown';
        }

        // Debug logging for missing user
        if (!user) {
          console.warn(`Assignment ${a.id} has no matching user for auth_id: ${a.auth_id}`);
        }

        return {
          id: a.id,
          authId: a.auth_id,
          moduleId: a.item_id,
          userName,
          userEmail: user?.email || 'N/A',
          empNumber: user?.employee_number || 'N/A',
          moduleName: itemName,
          itemType: a.item_type as 'module' | 'document',
          assignedAt: new Date(a.assigned_at).toLocaleDateString(),
          completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : undefined,
          status: a.completed_at ? 'Completed' : 'Incomplete',
        };
      }) || [];

      console.log(`Total ${type} assignments before user lookup: ${filtered?.length}, After: ${details.length}`);
      console.log(`Assignments with missing users: ${details.filter(d => d.userName === 'Unknown').length}`);

      // Log employee 2277 specifically for debugging
      const emp2277 = details.filter(d => d.empNumber === '2277');
      if (emp2277.length > 0) {
        console.log(`Employee 2277 has ${emp2277.length} ${type} assignments:`, emp2277);
      } else {
        console.log(`Employee 2277 NOT found in ${type} assignments`);
      }

      setDialogData(details);
    } catch (err) {
      console.error('Error fetching assignments detail:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const fetchFollowUpsDetail = async (type: 'upcoming' | 'overdue') => {
    setDialogLoading(true);
    try {
      const assignmentsData = await fetchAllUserAssignments({ follow_up_required: true });

      const today = new Date();
      const filtered = assignmentsData?.filter(a => {
        if (a.follow_up_assessment_completed_at) return false;
        const dueDate = new Date(a.follow_up_assessment_due_date);
        return type === 'upcoming' ? dueDate > today : dueDate <= today;
      });

      const { data: usersData } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name');

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, name');

      const { data: documentsData } = await supabase
        .from('documents')
        .select('id, title');

      const userMap = new Map(usersData?.map(u => [u.auth_id, `${u.first_name} ${u.last_name}`]) || []);
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
      const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);

      const details: FollowUpDetail[] = filtered?.map(a => {
        const itemName = a.item_type === 'module'
          ? moduleMap.get(a.item_id) || 'Unknown Module'
          : documentMap.get(a.item_id) || 'Unknown Document';

        return {
          id: a.id,
          userName: userMap.get(a.auth_id) || 'Unknown',
          moduleName: itemName,
          dueDate: new Date(a.follow_up_assessment_due_date).toLocaleDateString(),
          completedAt: a.follow_up_assessment_completed_at ? new Date(a.follow_up_assessment_completed_at).toLocaleDateString() : undefined,
          status: a.follow_up_assessment_completed_at ? 'Completed' : type === 'overdue' ? 'Overdue' : 'Upcoming',
        };
      }) || [];

      setDialogData(details);
    } catch (err) {
      console.error('Error fetching follow-ups detail:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const fetchUserAssignments = async (authId: string, userName: string, filterType: 'all' | 'completed' | 'incomplete') => {
    setDialogLoading(true);
    setSelectedUser({ id: authId, name: userName });
    try {
      console.log(`Fetching assignments for user: ${userName} (${authId}), filter: ${filterType}`);

      const assignmentsData = await fetchAllUserAssignments({ auth_id: authId });

      console.log(`Found ${assignmentsData?.length || 0} total assignments for ${userName}`);
      console.log('Assignments data:', assignmentsData);

      const { data: userData } = await supabase
        .from('users')
        .select('employee_number')
        .eq('auth_id', authId)
        .single();

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, name');

      const { data: documentsData } = await supabase
        .from('documents')
        .select('id, title');

      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
      const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);

      // Filter based on type
      let filteredData = assignmentsData || [];
      if (filterType === 'completed') {
        filteredData = filteredData.filter(a => a.completed_at);
      } else if (filterType === 'incomplete') {
        filteredData = filteredData.filter(a => !a.completed_at);
      }

      console.log(`After filtering (${filterType}): ${filteredData.length} assignments`);

      const details: AssignmentDetail[] = filteredData.map(a => {
        const itemName = a.item_type === 'module'
          ? moduleMap.get(a.item_id) || 'Unknown Module'
          : documentMap.get(a.item_id) || 'Unknown Document';

        return {
          id: a.id,
          userName: userName,
          userEmail: '',
          empNumber: userData?.employee_number || 'N/A',
          moduleName: itemName,
          assignedAt: new Date(a.assigned_at).toLocaleDateString(),
          completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : undefined,
          status: a.completed_at ? 'Completed' : 'Incomplete',
        };
      });

      setDialogData(details);
      setDialogOpen('user-assignments');
    } catch (err) {
      console.error('Error fetching user assignments:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleCardClick = async (cardType: string) => {
    setDialogOpen(cardType);

    switch (cardType) {
      case 'users':
        await fetchUsersDetail();
        break;
      case 'completed':
        await fetchAssignmentsDetail('completed');
        break;
      case 'incomplete':
        await fetchAssignmentsDetail('incomplete');
        break;
      case 'upcoming-followups':
        await fetchFollowUpsDetail('upcoming');
        break;
      case 'overdue-followups':
        await fetchFollowUpsDetail('overdue');
        break;
    }
  };

  const downloadTrainingRecordCSV = () => {
    if (!selectedUser || dialogData.length === 0) return;

    const assignments = dialogData as unknown as AssignmentDetail[];
    const csvContent = [
      ['Training Record for ' + selectedUser.name],
      ['Generated on ' + new Date().toLocaleString()],
      [],
      ['Module', 'Assigned Date', 'Completed Date', 'Status'],
      ...assignments.map(a => [
        a.moduleName,
        a.assignedAt,
        a.completedAt || 'N/A',
        a.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedUser.name.replace(/\s+/g, '_')}_training_record_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowDownloadFormatDialog(false);
  };

  const downloadTrainingRecordPDF = () => {
    if (!selectedUser || dialogData.length === 0) return;

    const assignments = dialogData as unknown as AssignmentDetail[];
    const logoUrl = `${window.location.origin}/logo-dec-2025.png`;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download PDF');
      return;
    }

    // Build HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Training Record - ${selectedUser.name}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              color: #333;
            }
            .header {
              background: linear-gradient(118deg, #05363a 0%, #0a706a 48%, #16cbcf 100%);
              border-bottom: 6px solid #fa7a20;
              padding: 20px 40px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .header img {
              height: 50px;
            }
            .content {
              padding: 40px;
            }
            h1 {
              color: #05363a;
              border-bottom: 3px solid #fa7a20;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .meta {
              color: #666;
              margin-bottom: 30px;
              font-size: 0.9em;
              line-height: 1.6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #fff;
              color: #333;
              padding: 12px;
              text-align: left;
              font-weight: bold;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .status-completed {
              color: #10b981;
              font-weight: bold;
            }
            .status-incomplete {
              color: #f59e0b;
              font-weight: bold;
            }
            .status-overdue {
              color: #ef4444;
              font-weight: bold;
            }
            @media print {
              body {
                padding: 0;
              }
              .header {
                padding: 15px 30px;
              }
              .content {
                padding: 30px;
              }
              @page {
                margin: 1cm;
              }
            }
            @media screen {
              .print-instructions {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 5px;
                color: #856404;
              }
            }
            @media print {
              .print-instructions {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-instructions">
            <strong>Instructions:</strong> Use Ctrl+P (or Cmd+P on Mac) to print, then select "Save as PDF" as the destination.
          </div>
          <div class="header">
            <img src="${logoUrl}" alt="Naranja" onerror="this.style.display='none'" />
          </div>
          <div class="content">
            <h1>Training Record</h1>
            <div class="meta">
              <strong>Employee:</strong> ${selectedUser.name}<br>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Assigned Date</th>
                  <th>Completed Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${assignments.map(a => `
                  <tr>
                    <td>${a.moduleName}</td>
                    <td>${a.assignedAt}</td>
                    <td>${a.completedAt || 'N/A'}</td>
                    <td class="status-${a.status.toLowerCase()}">${a.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setShowDownloadFormatDialog(false);
  };

  const downloadModuleCertificate = (assignment: AssignmentDetail) => {
    if (!assignment.completedAt) {
      alert('Certificate is only available for completed modules.');
      return;
    }

    if (!selectedUser) return;

    openCertificateWindow({
      recipientName: selectedUser.name,
      moduleName: assignment.moduleName,
      completedDate: assignment.completedAt,
    });
  };

  const handleDepartmentClick = async (dept: DepartmentStats, type: 'users' | 'assignments' | 'completed' | 'incomplete' | 'upcoming-refresh') => {
    setSelectedDepartment({ id: dept.departmentId, name: dept.departmentName });
    setDepartmentDialogType(type);
    setDialogLoading(true);

    try {
      if (type === 'users') {
        // Fetch users in this department
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, auth_id, first_name, last_name, employee_number, department_id, departments(name)')
          .eq('department_id', dept.departmentId);

        if (usersError) throw usersError;

        const { data: assignmentStats, error: statsError } = await supabase.rpc('get_user_assignment_stats');

        if (statsError) {
          console.warn('RPC function not available, falling back to client-side aggregation');
          const authIds = usersData?.map(u => u.auth_id) || [];
          const assignmentsData = await fetchAllUserAssignments({ auth_ids: authIds });

          const assignmentsByUser = new Map<string, { total: number; completed: number }>();
          assignmentsData?.forEach(a => {
            if (!assignmentsByUser.has(a.auth_id)) {
              assignmentsByUser.set(a.auth_id, { total: 0, completed: 0 });
            }
            const stats = assignmentsByUser.get(a.auth_id)!;
            stats.total++;
            if (a.completed_at) stats.completed++;
          });

          const details: UserDetail[] = usersData?.map(u => {
            const stats = assignmentsByUser.get(u.auth_id) || { total: 0, completed: 0 };
            return {
              id: u.id,
              authId: u.auth_id,
              name: `${u.first_name} ${u.last_name}`,
              empNumber: u.employee_number || 'N/A',
              department: (u.departments as any)?.name || 'N/A',
              totalAssignments: stats.total,
              completedAssignments: stats.completed,
              complianceRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
            };
          }) || [];

          setDialogData(details);
        } else {
          const statsMap = new Map(assignmentStats.map((s: any) => [s.auth_id, s]));
          const details: UserDetail[] = usersData?.map(u => {
            const stats: any = statsMap.get(u.auth_id) || { total: 0, completed: 0 };
            return {
              id: u.id,
              authId: u.auth_id,
              name: `${u.first_name} ${u.last_name}`,
              empNumber: u.employee_number || 'N/A',
              department: (u.departments as any)?.name || 'N/A',
              totalAssignments: stats.total || 0,
              completedAssignments: stats.completed || 0,
              complianceRate: stats.total > 0 ? ((stats.completed || 0) / stats.total) * 100 : 0,
            };
          }) || [];

          setDialogData(details);
        }
      } else if (type === 'assignments' || type === 'completed' || type === 'incomplete') {
        // Fetch assignments for this department
        const { data: usersData } = await supabase
          .from('users')
          .select('auth_id, first_name, last_name, email, employee_number')
          .eq('department_id', dept.departmentId);

        const authIds = usersData?.map(u => u.auth_id) || [];

        const assignmentsData = await fetchAllUserAssignments({ auth_ids: authIds });

        console.log(`Department ${dept.departmentName} - Total assignments: ${assignmentsData?.length || 0}`);

        const filtered = type === 'completed'
          ? assignmentsData?.filter(a => a.completed_at)
          : type === 'incomplete'
          ? assignmentsData?.filter(a => !a.completed_at)
          : assignmentsData;

        console.log(`Department ${dept.departmentName} - Filtered ${type}: ${filtered?.length || 0}`);

        // Debug employee 2277 in department view
        const emp2277InDept = usersData?.find(u => u.employee_number === '2277');
        if (emp2277InDept) {
          const emp2277DeptAssignments = assignmentsData?.filter(a => a.auth_id === emp2277InDept.auth_id) || [];
          const emp2277DeptIncomplete = emp2277DeptAssignments.filter(a => !a.completed_at);
          console.log(`Dept view - Employee 2277: Total ${emp2277DeptAssignments.length}, Incomplete ${emp2277DeptIncomplete.length}`);
          if (emp2277DeptIncomplete.length > 0) {
            console.log('Dept view - Employee 2277 incomplete assignments:', emp2277DeptIncomplete);
          }
        }

        const { data: modulesData } = await supabase
          .from('modules')
          .select('id, name');

        const { data: documentsData } = await supabase
          .from('documents')
          .select('id, title');

        const userMap = new Map(usersData?.map(u => [u.auth_id, u]) || []);
        const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
        const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);

        const details: AssignmentDetail[] = filtered?.map(a => {
          const user = userMap.get(a.auth_id);
          const itemName = a.item_type === 'module'
            ? moduleMap.get(a.item_id) || 'Unknown Module'
            : documentMap.get(a.item_id) || 'Unknown Document';

          // Properly construct user name, handling null/undefined/empty values
          let userName = 'Unknown';
          if (user) {
            const firstName = (user.first_name || '').trim();
            const lastName = (user.last_name || '').trim();
            userName = [firstName, lastName].filter(n => n).join(' ') || 'Unknown';
          }

          return {
            id: a.id,
            authId: a.auth_id,
            moduleId: a.item_id,
            userName,
            userEmail: user?.email || 'N/A',
            empNumber: user?.employee_number || 'N/A',
            moduleName: itemName,
            itemType: a.item_type as 'module' | 'document',
            assignedAt: new Date(a.assigned_at).toLocaleDateString(),
            completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : undefined,
            status: a.completed_at ? 'Completed' : 'Incomplete',
          };
        }) || [];

        setDialogData(details);
      } else if (type === 'upcoming-refresh') {
        // Fetch follow-up assessments due within 30 days for this department
        const { data: usersData } = await supabase
          .from('users')
          .select('auth_id, first_name, last_name')
          .eq('department_id', dept.departmentId);

        const authIds = usersData?.map(u => u.auth_id) || [];

        const assignmentsData = await fetchAllUserAssignments({ auth_ids: authIds, follow_up_required: true });

        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const filtered = assignmentsData?.filter(a => {
          if (a.follow_up_assessment_completed_at) return false;
          const dueDate = new Date(a.follow_up_assessment_due_date);
          return dueDate > today && dueDate <= thirtyDaysFromNow;
        });

        const { data: modulesData } = await supabase
          .from('modules')
          .select('id, name');

        const { data: documentsData } = await supabase
          .from('documents')
          .select('id, title');

        const userMap = new Map(usersData?.map(u => [u.auth_id, `${u.first_name} ${u.last_name}`]) || []);
        const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
        const documentMap = new Map(documentsData?.map(d => [d.id, d.title]) || []);

        const details: FollowUpDetail[] = filtered?.map(a => {
          const itemName = a.item_type === 'module'
            ? moduleMap.get(a.item_id) || 'Unknown Module'
            : documentMap.get(a.item_id) || 'Unknown Document';

          return {
            id: a.id,
            userName: userMap.get(a.auth_id) || 'Unknown',
            moduleName: itemName,
            itemType: a.item_type as 'module' | 'document',
            dueDate: new Date(a.follow_up_assessment_due_date).toLocaleDateString(),
            completedAt: a.follow_up_assessment_completed_at ? new Date(a.follow_up_assessment_completed_at).toLocaleDateString() : undefined,
            status: 'Upcoming',
          };
        }) || [];

        setDialogData(details);
      }
    } catch (err) {
      console.error('Error fetching department details:', err);
    } finally {
      setDialogLoading(false);
    }
  };

  const downloadDepartmentCSV = () => {
    if (!selectedDepartment || !dialogData.length) return;

    const rows: string[] = [];
    const dialogType = departmentDialogType;

    rows.push(`${selectedDepartment.name} - ${
      dialogType === 'users' ? 'Users' :
      dialogType === 'completed' ? 'Completed Assignments' :
      dialogType === 'incomplete' ? 'Incomplete Assignments' :
      dialogType === 'upcoming-refresh' ? 'Upcoming Refresh Assessments' :
      'All Assignments'
    }`);
    rows.push(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    rows.push('');

    if (dialogType === 'users') {
      rows.push('Name,Employee #,Total Assignments,Completed,Compliance Rate');
      (dialogData as UserDetail[]).forEach(user => {
        rows.push(`${user.name},${user.empNumber},${user.totalAssignments},${user.completedAssignments},${user.complianceRate.toFixed(1)}%`);
      });
    } else if (dialogType === 'upcoming-refresh') {
      rows.push('User Name,Item,Type,Due Date,Status');
      (dialogData as FollowUpDetail[]).forEach(item => {
        rows.push(`${item.userName},${item.moduleName},${item.itemType || 'N/A'},${item.dueDate},${item.status}`);
      });
    } else {
      rows.push('Employee #,User Name,Item,Type,Assigned Date,Completed Date,Status');
      (dialogData as AssignmentDetail[]).forEach(assignment => {
        rows.push(`${assignment.empNumber},${assignment.userName},${assignment.moduleName},${assignment.itemType || 'N/A'},${assignment.assignedAt},${assignment.completedAt || 'N/A'},${assignment.status}`);
      });
    }

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDepartment.name.replace(/\s+/g, '-')}-${dialogType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch associated tests for a module
  const fetchAssociatedTests = async (moduleId: string, userId: string) => {
    try {
      console.log("Fetching tests for module:", moduleId, "and user (internal ID):", userId);

      // First get the tests for this module
      const { data: tests, error } = await supabase
        .from("question_packs")
        .select("id, title, module_id")
        .eq("is_active", true)
        .eq("is_archived", false)
        .eq("module_id", moduleId)
        .order("title", { ascending: true });

      if (error) throw error;
      console.log("Found tests:", tests);

      // For each test, check if the user has a passed attempt
      const testsWithStatus = await Promise.all(
        (tests || []).map(async (test) => {
          const { data: attempts, error: attemptError } = await supabase
            .from("test_attempts")
            .select("score_percent, completed_at")
            .eq("pack_id", test.id)
            .eq("user_id", userId)
            .eq("passed", true)
            .order("completed_at", { ascending: false })
            .limit(1);

          if (attemptError) {
            console.error("Error fetching attempts for test:", test.id, attemptError);
            return { id: test.id, title: test.title, passedAttempt: null };
          }

          if (attempts && attempts.length > 0) {
            return {
              id: test.id,
              title: test.title,
              passedAttempt: {
                score: attempts[0].score_percent,
                completedAt: attempts[0].completed_at,
              },
            };
          }

          return { id: test.id, title: test.title, passedAttempt: null };
        })
      );

      console.log("Setting associated tests with status:", testsWithStatus);
      setAssociatedTests(testsWithStatus);
    } catch (e) {
      console.error("Failed to fetch associated tests:", e);
      setAssociatedTests([]);
    }
  };

  // Fetch documents linked to a module
  const fetchAssociatedDocuments = async (moduleId: string, authId?: string) => {
    try {
      console.log("Fetching documents for module:", moduleId);

      // Get documents linked to this module via document_modules junction table
      const { data: linkedDocs, error } = await supabase
        .from("document_modules")
        .select("document_id")
        .eq("module_id", moduleId);

      if (error) throw error;
      console.log("Found linked document IDs:", linkedDocs);

      if (!linkedDocs || linkedDocs.length === 0) {
        setAssociatedDocuments([]);
        setDocumentConfirmations({});
        return;
      }

      // Get the actual document details
      const documentIds = linkedDocs.map((link: any) => link.document_id);
      const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("id, title, reference_code, file_url")
        .in("id", documentIds);

      if (docsError) throw docsError;

      console.log("Setting associated documents:", documents);
      setAssociatedDocuments(documents || []);

      // Check if user has already completed these documents
      if (authId && documentIds.length > 0) {
        const { data: completedDocs, error: completedError } = await supabase
          .from("user_assignments")
          .select("item_id, completed_at")
          .eq("auth_id", authId)
          .eq("item_type", "document")
          .in("item_id", documentIds)
          .not("completed_at", "is", null);

        if (completedError) {
          console.error("Error checking document completions:", completedError);
        } else {
          // Build a map of document_id -> true for completed documents
          const completedMap: Record<string, boolean> = {};
          completedDocs?.forEach((doc: any) => {
            completedMap[doc.item_id] = true;
          });
          console.log("Document completion status:", completedMap);
          setDocumentConfirmations(completedMap);
        }
      } else {
        setDocumentConfirmations({});
      }
    } catch (e) {
      console.error("Failed to fetch associated documents:", e);
      setAssociatedDocuments([]);
      setDocumentConfirmations({});
    }
  };

  const fetchModules = async () => {
    setModulesLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, ref_code, description, learning_objectives, estimated_duration, delivery_format, target_audience, prerequisites, attachments, requires_follow_up, follow_up_period, refresh_period, created_at')
        .order('name', { ascending: true });

      if (error) throw error;
      setModulesData(data || []);
    } catch (e) {
      console.error('Failed to fetch modules:', e);
      setModulesData([]);
    } finally {
      setModulesLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setDocumentsLoading(true);
    try {
      // First fetch documents with basic info
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          reference_code,
          file_url,
          notes,
          current_version,
          created_at,
          last_reviewed_at,
          review_period_months,
          location,
          document_type_id
        `)
        .eq('archived', false)
        .order('title', { ascending: true });

      if (docsError) throw docsError;

      // Fetch document types
      const { data: docTypes } = await supabase
        .from('document_types')
        .select('id, name');

      // Fetch document-module links
      const { data: docModules } = await supabase
        .from('document_modules')
        .select('document_id, module_id');

      // Fetch modules
      const { data: modules } = await supabase
        .from('modules')
        .select('id, name');

      // Combine the data
      const enrichedDocs = (docs || []).map(doc => {
        const docType = docTypes?.find(dt => dt.id === doc.document_type_id);
        const linkedModuleIds = docModules?.filter(dm => dm.document_id === doc.id).map(dm => dm.module_id) || [];
        const linkedModules = modules?.filter(m => linkedModuleIds.includes(m.id)) || [];

        return {
          ...doc,
          document_types: docType ? { name: docType.name } : null,
          document_modules: linkedModules.map(m => ({ modules: { id: m.id, name: m.name } }))
        };
      });

      setDocumentsData(enrichedDocs);
    } catch (e) {
      console.error('Failed to fetch documents:', e);
      setDocumentsData([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Language autocomplete handler
  const handleLanguageInputChange = useCallback((value: string) => {
    setLogForm((f) => ({ ...f, translationLanguage: value }));

    if (value.trim().length > 0) {
      const matches = commonLanguages.filter(lang =>
        lang.toLowerCase().includes(value.toLowerCase())
      );
      setLanguageSuggestions(matches);
      setShowLanguageSuggestions(matches.length > 0);
    } else {
      setLanguageSuggestions([]);
      setShowLanguageSuggestions(false);
    }
  }, [commonLanguages]);

  const handleLanguageSelect = useCallback((language: string) => {
    setLogForm((f) => ({ ...f, translationLanguage: language }));
    setShowLanguageSuggestions(false);
    setLanguageSuggestions([]);
  }, []);

  // Signature change handlers
  const handleLearnerSignatureChange = useCallback((dataUrl: string) => {
    setLogForm((f) => ({ ...f, learnerSignature: dataUrl }));
  }, []);

  const handleTrainerSignatureChange = useCallback((dataUrl: string) => {
    setLogForm((f) => ({ ...f, trainerSignature: dataUrl }));
  }, []);

  const handleTranslatorSignatureChange = useCallback((dataUrl: string) => {
    setLogForm((f) => ({ ...f, translatorSignature: dataUrl }));
  }, []);

  const handleOpenLogTraining = async (assignment: AssignmentDetail) => {
    // Check if this is a document assignment
    if (assignment.itemType === 'document') {
      // Open document confirmation dialog
      if (!assignment.authId || !assignment.moduleId) {
        alert('Missing user or document information');
        return;
      }

      setDocumentConfirmationData({
        assignmentId: assignment.id,
        authId: assignment.authId,
        documentId: assignment.moduleId,
        documentTitle: assignment.moduleName,
        userName: assignment.userName,
      });
      return;
    }

    // Otherwise, it's a module - open the training log dialog
    if (!assignment.authId || !assignment.moduleId) {
      alert('Missing user or module information');
      return;
    }

    // Get the user's internal ID from auth_id
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_id", assignment.authId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user ID:", userError);
      alert('Failed to load user information');
      return;
    }

    setLogTrainingData({
      assignmentId: assignment.id,
      authId: assignment.authId,
      userId: userData.id,
      userName: assignment.userName,
      moduleId: assignment.moduleId,
      moduleName: assignment.moduleName,
    });

    // Reset form
    setLogForm({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      durationHours: '1',
      outcome: 'completed',
      notes: '',
      learnerSignature: '',
      trainerSignature: '',
      translatorSignature: '',
      translationRequired: 'no',
      translationLanguage: '',
      translatorName: ''
    });

    // Clear signature pads
    learnerPadRef.current?.clear();
    trainerPadRef.current?.clear();

    // Fetch associated tests and documents for the module
    await fetchAssociatedTests(assignment.moduleId, userData.id);
    await fetchAssociatedDocuments(assignment.moduleId, assignment.authId);

    setLogTrainingOpen(true);
  };

  const handleSubmitLogTraining = async () => {
    if (!logTrainingData) return;

    // Validate document confirmations for completed outcome
    if (logForm.outcome === 'completed' && associatedDocuments.length > 0) {
      const unconfirmedDocs = associatedDocuments.filter(doc => !documentConfirmations[doc.id]);
      if (unconfirmedDocs.length > 0) {
        alert(`Please confirm that you have read all associated documents:\n${unconfirmedDocs.map(d => `- ${d.title}`).join('\n')}`);
        return;
      }
    }

    // Validate signatures for completed outcome
    if (logForm.outcome === 'completed') {
      if (!logForm.learnerSignature.trim()) {
        alert("Please provide the learner's e-signature for satisfactory training completion.");
        return;
      }
      if (!logForm.trainerSignature.trim()) {
        alert("Please provide the trainer's e-signature for satisfactory training completion.");
        return;
      }
      if (logForm.translationRequired === 'yes' && !logForm.translatorSignature.trim()) {
        alert("Please provide the translator's e-signature since translation was required.");
        return;
      }
    }

    setLogBusy(true);
    try {
      console.log("=== TrainingDashboard: Logging training completion ===");
      console.log("User auth_id:", logTrainingData.authId);
      console.log("Module ID:", logTrainingData.moduleId);
      console.log("Assignment ID:", logTrainingData.assignmentId);

      // 1) Insert into training_logs
      const { error: insertErr } = await supabase.from("training_logs").insert([
        {
          auth_id: logTrainingData.authId,
          date: logForm.date,
          time: logForm.time,
          topic: logTrainingData.moduleId,
          duration_hours: Number(logForm.durationHours) || 1,
          outcome: logForm.outcome,
          notes: logForm.notes?.trim() || null,
          signature: logForm.outcome === 'completed' ? logForm.learnerSignature : null,
          trainer_signature: logForm.outcome === 'completed' ? logForm.trainerSignature : null,
          translator_signature: (logForm.outcome === 'completed' && logForm.translationRequired === 'yes') ? logForm.translatorSignature : null,
          translation_required: logForm.translationRequired === 'yes',
          translation_language: logForm.translationRequired === 'yes' ? logForm.translationLanguage : null,
          translator_name: logForm.translationRequired === 'yes' ? logForm.translatorName : null,
        },
      ]);

      if (insertErr) {
        console.error("Insert training_logs failed:", insertErr);
        alert(`Failed to log training: ${insertErr.message}`);
        setLogBusy(false);
        return;
      }

      console.log("Training log inserted successfully");

      // 2) Record completion via API
      console.log("Recording training outcome via API...");
      const payload = {
        auth_id: logTrainingData.authId,
        item_id: logTrainingData.moduleId,
        item_type: 'module',
        completed_date: logForm.date,
        training_outcome: logForm.outcome,
        linked_document_ids: associatedDocuments.map(doc => doc.id)
      };

      const response = await fetch('/api/record-training-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error);
        throw new Error(error.error || 'Failed to record training outcome');
      }

      const result = await response.json();
      console.log("Training outcome recorded successfully:", result);

      // Close dialog and refresh data
      setLogTrainingOpen(false);
      setLogTrainingData(null);

      // Show success message
      setSuccessModal({
        open: true,
        message: `Training logged successfully for ${logTrainingData.userName}`,
      });

      // Refresh the incomplete assignments list
      if (dialogOpen === 'incomplete') {
        await fetchAssignmentsDetail('incomplete');
      }

      // Refresh overall compliance data
      await fetchComplianceData();

    } catch (e) {
      console.error("Error in handleSubmitLogTraining:", e);
      alert("Failed to log training.");
    } finally {
      setLogBusy(false);
    }
  };

  const handleConfirmDocument = async (assignmentId: string, authId: string, documentId: string) => {
    try {
      console.log("=== TrainingDashboard: Confirming document reading ===");
      console.log("User auth_id:", authId);
      console.log("Document ID:", documentId);
      console.log("Assignment ID:", assignmentId);

      // Call the API to record document completion
      const payload = {
        auth_id: authId,
        item_id: documentId,
        item_type: 'document',
        completed_date: new Date().toISOString().split('T')[0],
      };

      const response = await fetch('/api/record-training-completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("API error:", error);
        throw new Error(error.error || 'Failed to record document confirmation');
      }

      const result = await response.json();
      console.log("Document confirmation recorded successfully:", result);

      // Close the dialog
      setDocumentConfirmationData(null);

      // Show success message
      setSuccessModal({
        open: true,
        message: `Document reading confirmed successfully`,
      });

      // Refresh the incomplete assignments list
      if (dialogOpen === 'incomplete') {
        await fetchAssignmentsDetail('incomplete');
      }

      // Refresh overall compliance data
      await fetchComplianceData();

    } catch (error) {
      console.error("Error confirming document:", error);
      alert("Failed to confirm document reading.");
      throw error;
    }
  };

  const downloadComplianceReport = () => {
    const rows: string[] = [];

    // Overall stats
    rows.push('OVERALL TRAINING COMPLIANCE REPORT');
    rows.push(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    rows.push('');
    rows.push('SUMMARY STATISTICS');
    rows.push(`Total Users,${complianceStats.totalUsers}`);
    rows.push(`Total Assignments,${complianceStats.totalAssignments}`);
    rows.push(`Completed Assignments,${complianceStats.completedAssignments}`);
    rows.push(`Incomplete Assignments,${complianceStats.overdueAssignments}`);
    rows.push(`Overall Compliance Rate,${complianceStats.complianceRate.toFixed(1)}%`);
    rows.push(`Upcoming Follow-ups,${complianceStats.upcomingFollowUps}`);
    rows.push(`Overdue Follow-ups,${complianceStats.overdueFollowUps}`);
    rows.push('');

    // Department stats
    rows.push('DEPARTMENT COMPLIANCE');
    rows.push('Department,Total Users,Total Assignments,Completed,Incomplete,Refresh Due (30d),Compliance Rate');
    departmentStats.forEach(dept => {
      rows.push(`${dept.departmentName},${dept.totalUsers},${dept.totalAssignments},${dept.completedAssignments},${dept.incompleteAssignments},${dept.upcomingRefreshDue},${dept.complianceRate.toFixed(1)}%`);
    });
    rows.push('');

    // Training item stats (modules and documents)
    rows.push('TRAINING ITEMS NEEDING ATTENTION (Bottom 10)');
    rows.push('Item Name,Type,Total Assignments,Completed,Compliance Rate');
    trainingItemStats.forEach(item => {
      rows.push(`${item.itemName},${item.itemType},${item.totalAssignments},${item.completedAssignments},${item.complianceRate.toFixed(1)}%`);
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-compliance-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !lastUpdated) {
    return (
      <div className="training-dashboard" style={{ textAlign: 'center', padding: '40px' }}>
        <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-white)' }}>Loading compliance data...</p>
      </div>
    );
  }

  return (
    <>
      <ContentHeader
        title="Training Compliance Dashboard"
        description="Real-time overview of training compliance across your organization"
      />

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        flexWrap: 'wrap',
        padding: '16px 24px',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderBottom: '1px solid rgba(var(--neon-rgb), 0.2)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="auto-refresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <label htmlFor="auto-refresh" style={{ cursor: 'pointer', color: 'var(--text-white)', fontSize: '0.9rem' }}>
            Auto-refresh (1 min)
          </label>
        </div>

        <TextIconButton
          variant="refresh"
          label="Refresh"
          onClick={fetchComplianceData}
          disabled={loading}
          title="Refresh data now"
        />

        <TextIconButton
          variant="view"
          icon={<FiBook />}
          label="View Modules"
          onClick={() => {
            setShowModulesDialog(true);
            fetchModules();
          }}
          title="View training modules"
        />

        <TextIconButton
          variant="view"
          icon={<FiFileText />}
          label="View Documents"
          onClick={() => {
            setShowDocumentsDialog(true);
            fetchDocuments();
          }}
          title="View training documents"
        />

        <TextIconButton
          variant="view"
          icon={<FiGrid />}
          label="Training Matrix"
          onClick={() => setShowTrainingMatrix(true)}
          title="View training matrix"
        />

        <TextIconButton
          variant="view"
          icon={<FiClipboard />}
          label="View Test Results"
          onClick={() => setShowTestResults(true)}
          title="View all completed test results"
        />

        <TextIconButton
          variant="download"
          label="Download Report"
          onClick={downloadComplianceReport}
          title="Download compliance report"
        />

        {lastUpdated && (
          <span style={{ fontSize: '0.85rem', color: 'var(--text-white)', opacity: 0.7 }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="error-box" style={{ marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div
          className="stat-card"
          onClick={() => handleCardClick('users')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiUsers size={32} style={{ color: 'var(--neon)' }} />
          </div>
          <div className="stat-card-value">{complianceStats.totalUsers}</div>
          <div className="stat-card-label">Total Users</div>
        </div>

        <div
          className="stat-card"
          onClick={() => handleCardClick('completed')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiCheckCircle size={32} style={{ color: 'var(--text-success)' }} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--text-success)' }}>
            {complianceStats.completedAssignments}
          </div>
          <div className="stat-card-label">Completed</div>
        </div>

        <div
          className="stat-card"
          onClick={() => handleCardClick('incomplete')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiAlertCircle size={32} style={{ color: 'var(--text-error)' }} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--text-error)' }}>
            {complianceStats.overdueAssignments}
          </div>
          <div className="stat-card-label">Incomplete</div>
        </div>

        <div className="stat-card">
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiTrendingUp size={32} style={{ color: 'var(--neon)' }} />
          </div>
          <div className="stat-card-value">
            {complianceStats.complianceRate.toFixed(1)}%
          </div>
          <div className="stat-card-label">Compliance Rate</div>
        </div>

        <div
          className="stat-card"
          onClick={() => handleCardClick('upcoming-followups')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiClock size={32} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>
            {complianceStats.upcomingFollowUps}
          </div>
          <div className="stat-card-label">Upcoming Follow-ups</div>
        </div>

        <div
          className="stat-card"
          onClick={() => handleCardClick('overdue-followups')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div className="icon-wrapper" style={{ marginBottom: '12px' }}>
            <FiAlertCircle size={32} style={{ color: 'var(--text-error)' }} />
          </div>
          <div className="stat-card-value" style={{ color: 'var(--text-error)' }}>
            {complianceStats.overdueFollowUps}
          </div>
          <div className="stat-card-label">Overdue Follow-ups</div>
        </div>
      </div>

      {/* Department Compliance */}
      <div className="neon-panel" style={{ marginBottom: '32px' }}>
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>
          Department Compliance
        </h2>
        {departmentStats.length === 0 ? (
          <div className="empty-state">No department data available</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Department
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Users
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Assignments
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Completed
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Incomplete
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Refresh Due (30d)
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Compliance Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept) => (
                <tr key={dept.departmentId} style={{ borderBottom: '1px solid rgba(64, 224, 208, 0.18)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-white)' }}>{dept.departmentName}</td>
                  <td
                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDepartmentClick(dept, 'users')}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#1e3a8a',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {dept.totalUsers}
                    </span>
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDepartmentClick(dept, 'assignments')}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#1e3a8a',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {dept.totalAssignments}
                    </span>
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDepartmentClick(dept, 'completed')}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-success)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {dept.completedAssignments}
                    </span>
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDepartmentClick(dept, 'incomplete')}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--text-error)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {dept.incompleteAssignments}
                    </span>
                  </td>
                  <td
                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => handleDepartmentClick(dept, 'upcoming-refresh')}
                  >
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      {dept.upcomingRefreshDue}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      color: dept.complianceRate >= 80 ? 'var(--text-success)' : dept.complianceRate >= 50 ? '#f59e0b' : 'var(--text-error)',
                      fontWeight: 'bold'
                    }}>
                      {dept.complianceRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Training Items Needing Attention (Bottom 10) */}
      <div className="neon-panel" style={{ marginBottom: '32px' }}>
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>
          Training Items Needing Attention (Lowest Compliance)
        </h2>
        {trainingItemStats.length === 0 ? (
          <div className="empty-state">No training item data available</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Item Name
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Type
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Assignments
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Completed
                </th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Compliance Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {trainingItemStats.map((item) => (
                <tr key={`${item.itemType}:${item.itemId}`} style={{ borderBottom: '1px solid rgba(64, 224, 208, 0.18)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-white)' }}>{item.itemName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: item.itemType === 'module' ? '#1e3a8a' : '#7c3aed',
                      color: 'white'
                    }}>
                      {item.itemType === 'module' ? 'Module' : 'Document'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{item.totalAssignments}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{item.completedAssignments}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      color: item.complianceRate >= 80 ? 'var(--text-success)' : item.complianceRate >= 50 ? '#f59e0b' : 'var(--text-error)',
                      fontWeight: 'bold'
                    }}>
                      {item.complianceRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Activity */}
      <div className="neon-panel">
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>
          Recent Training Completions ({recentActivity.length} items)
        </h2>
        {recentActivity.length === 0 ? (
          <div className="empty-state">No recent activity</div>
        ) : (
          <NeonTable
            columns={[
              {
                header: 'Emp #',
                accessor: 'empNumber',
                width: 100
              },
              {
                header: 'User Name',
                accessor: 'userName',
                width: 200
              },
              {
                header: 'Department',
                accessor: 'department',
                width: 180
              },
              {
                header: 'Item',
                accessor: 'moduleName',
                width: 300
              },
              {
                header: 'Completed At',
                accessor: 'completedAt',
                width: 180,
                render: (value) => {
                  const date = new Date(value as string);
                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                }
              },
            ]}
            data={recentActivity as unknown as Record<string, unknown>[]}
          />
        )}
      </div>

      {/* Dialogs */}
      <OverlayDialog
        open={dialogOpen === 'users'}
        onClose={() => {
          setDialogOpen(null);
          setUsersSearchQuery('');
        }}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>All Users</h2>

          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              className="neon-input"
              placeholder="Search by name, employee number, or department..."
              value={usersSearchQuery}
              onChange={(e) => setUsersSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'Name', accessor: 'name', width: 200 },
                { header: 'Emp #', accessor: 'empNumber', width: 120 },
                { header: 'Department', accessor: 'department', width: 180 },
                {
                  header: 'Total Assignments',
                  accessor: 'totalAssignments',
                  width: 150,
                  align: 'center',
                  render: (value, row) => {
                    const user = row as unknown as UserDetail;
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#1e3a8a',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUserAssignments(user.authId, user.name, 'all');
                        }}
                      >
                        {value as number}
                      </span>
                    );
                  }
                },
                {
                  header: 'Completed',
                  accessor: 'completedAssignments',
                  width: 120,
                  align: 'center',
                  render: (value, row) => {
                    const user = row as unknown as UserDetail;
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-success)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUserAssignments(user.authId, user.name, 'completed');
                        }}
                      >
                        {value as number}
                      </span>
                    );
                  }
                },
                {
                  header: 'Incomplete',
                  accessor: 'id',
                  width: 120,
                  align: 'center',
                  render: (_value, row) => {
                    const user = row as unknown as UserDetail;
                    const incompleteCount = user.totalAssignments - user.completedAssignments;
                    return (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--text-error)',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchUserAssignments(user.authId, user.name, 'incomplete');
                        }}
                      >
                        {incompleteCount}
                      </span>
                    );
                  }
                },
                {
                  header: 'Compliance Rate',
                  accessor: 'complianceRate',
                  width: 150,
                  align: 'center',
                  render: (value) => {
                    const rate = value as number;
                    return (
                      <span style={{
                        color: rate >= 80 ? 'var(--text-success)' : rate >= 50 ? '#f59e0b' : 'var(--text-error)',
                        fontWeight: 'bold'
                      }}>
                        {rate.toFixed(1)}%
                      </span>
                    );
                  }
                },
              ]}
              data={
                (dialogData as unknown as UserDetail[])
                  .filter((user) => {
                    if (!usersSearchQuery.trim()) return true;
                    const query = usersSearchQuery.toLowerCase();
                    return (
                      user.name?.toLowerCase().includes(query) ||
                      user.empNumber?.toLowerCase().includes(query) ||
                      user.department?.toLowerCase().includes(query)
                    );
                  }) as unknown as Record<string, unknown>[]
              }
            />
          )}

          {/* Show filtered count */}
          {!dialogLoading && usersSearchQuery.trim() && (
            <div style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: 'var(--text-white)',
              opacity: 0.7,
              textAlign: 'center'
            }}>
              Showing {
                (dialogData as unknown as UserDetail[])
                  .filter((user) => {
                    const query = usersSearchQuery.toLowerCase();
                    return (
                      user.name?.toLowerCase().includes(query) ||
                      user.empNumber?.toLowerCase().includes(query) ||
                      user.department?.toLowerCase().includes(query)
                    );
                  }).length
              } of {(dialogData as unknown as UserDetail[]).length} users
            </div>
          )}
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={dialogOpen === 'completed'}
        onClose={() => setDialogOpen(null)}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>Completed Assignments</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Email', accessor: 'userEmail', width: 250 },
                { header: 'Item', accessor: 'moduleName', width: 250 },
                { header: 'Assigned', accessor: 'assignedAt', width: 130 },
                { header: 'Completed', accessor: 'completedAt', width: 130 },
                { header: 'Status', accessor: 'status', width: 120 },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={dialogOpen === 'incomplete'}
        onClose={() => {
          setDialogOpen(null);
          setIncompleteSearchQuery('');
        }}
        width={1300}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>Incomplete Assignments</h2>

          {/* Search Bar */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              className="neon-input"
              placeholder="Search by user name, email, or module name..."
              value={incompleteSearchQuery}
              onChange={(e) => setIncompleteSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'Emp #', accessor: 'empNumber', width: 120 },
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Item', accessor: 'moduleName', width: 250 },
                { header: 'Assigned', accessor: 'assignedAt', width: 130 },
                { header: 'Status', accessor: 'status', width: 100 },
                {
                  header: 'Actions',
                  accessor: 'id',
                  width: 150,
                  render: (_value, row) => {
                    const assignment = row as unknown as AssignmentDetail;
                    const isDocument = assignment.itemType === 'document';
                    return (
                      <TextIconButton
                        variant="edit"
                        label={isDocument ? "Confirm Reading" : "Log Training"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLogTraining(assignment);
                        }}
                      />
                    );
                  }
                },
              ]}
              data={
                (dialogData as unknown as AssignmentDetail[])
                  .filter((assignment) => {
                    if (!incompleteSearchQuery.trim()) return true;
                    const query = incompleteSearchQuery.toLowerCase();
                    return (
                      assignment.userName.toLowerCase().includes(query) ||
                      assignment.userEmail.toLowerCase().includes(query) ||
                      assignment.moduleName.toLowerCase().includes(query)
                    );
                  }) as unknown as Record<string, unknown>[]
              }
            />
          )}

          {/* Show filtered count */}
          {!dialogLoading && incompleteSearchQuery.trim() && (
            <div style={{
              marginTop: '12px',
              fontSize: '0.9rem',
              color: 'var(--text-white)',
              opacity: 0.7,
              textAlign: 'center'
            }}>
              Showing {
                (dialogData as unknown as AssignmentDetail[])
                  .filter((assignment) => {
                    const query = incompleteSearchQuery.toLowerCase();
                    return (
                      assignment.userName.toLowerCase().includes(query) ||
                      assignment.userEmail.toLowerCase().includes(query) ||
                      assignment.moduleName.toLowerCase().includes(query)
                    );
                  }).length
              } of {(dialogData as unknown as AssignmentDetail[]).length} incomplete assignments
            </div>
          )}
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={dialogOpen === 'upcoming-followups'}
        onClose={() => setDialogOpen(null)}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>Upcoming Follow-ups</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Item', accessor: 'moduleName', width: 300 },
                { header: 'Due Date', accessor: 'dueDate', width: 130 },
                { header: 'Status', accessor: 'status', width: 120 },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={dialogOpen === 'overdue-followups'}
        onClose={() => setDialogOpen(null)}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>Overdue Follow-ups</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Item', accessor: 'moduleName', width: 300 },
                { header: 'Due Date', accessor: 'dueDate', width: 130 },
                {
                  header: 'Status',
                  accessor: 'status',
                  width: 120,
                  render: (value) => (
                    <span style={{ color: 'var(--text-error)', fontWeight: 'bold' }}>
                      {value as string}
                    </span>
                  )
                },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={dialogOpen === 'user-assignments'}
        onClose={() => setDialogOpen(null)}
        width={1000}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>
            <h2 className="neon-heading" style={{ margin: 0 }}>
              Assignments for {selectedUser?.name}
            </h2>
            <TextIconButton
              variant="download"
              icon={<FiDownload />}
              label="Download Record"
              onClick={() => {
                if (!selectedUser || dialogData.length === 0) return;
                setShowDownloadFormatDialog(true);
              }}
              title="Download user's training record"
            />
          </div>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'Item', accessor: 'moduleName', width: 300 },
                { header: 'Assigned', accessor: 'assignedAt', width: 110 },
                { header: 'Completed', accessor: 'completedAt', width: 110 },
                {
                  header: 'Status',
                  accessor: 'status',
                  width: 100,
                  render: (value) => (
                    <span style={{
                      color: value === 'Completed' ? 'var(--text-success)' : 'var(--text-error)',
                      fontWeight: 'bold'
                    }}>
                      {value as string}
                    </span>
                  )
                },
                {
                  header: 'Certificate',
                  accessor: 'id',
                  width: 100,
                  align: 'center',
                  render: (_value, row) => {
                    const assignment = row as unknown as AssignmentDetail;
                    return (
                      <CustomTooltip text={assignment.completedAt ? "Download Certificate" : "Complete module to download certificate"}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadModuleCertificate(assignment);
                          }}
                          disabled={!assignment.completedAt}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: assignment.completedAt ? 'pointer' : 'not-allowed',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: assignment.completedAt ? 1 : 0.3,
                          }}
                        >
                          <FiAward
                            size={20}
                            style={{
                              color: assignment.completedAt ? '#f59e0b' : '#666'
                            }}
                          />
                        </button>
                      </CustomTooltip>
                    );
                  }
                },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </OverlayDialog>

      {/* Log Training Dialog */}
      <OverlayDialog
        open={logTrainingOpen}
        onClose={() => !logBusy && setLogTrainingOpen(false)}
        width={1000}
        showCloseButton
        closeOnOutsideClick={!logBusy}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '85vh', overflow: 'hidden', margin: '-2rem', padding: '0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px', color: 'var(--neon)', padding: '2rem 2rem 0 2rem', flexShrink: 0 }}>
            Log Training - {logTrainingData?.userName}
          </h2>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 2rem 2rem 2rem' }}>
            <NeonForm
              title=""
              submitLabel={logBusy ? "Saving..." : "Save Log"}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitLogTraining();
              }}
            >
              <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(64, 224, 208, 0.1)', borderRadius: '8px' }}>
                <strong>Module:</strong> {logTrainingData?.moduleName}
              </div>

              {/* Date, Time, Duration, and Outcome in a row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8, minHeight: '1.25rem' }}>Date</span>
                  <input
                    type="date"
                    className="neon-input"
                    value={logForm.date}
                    onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
                    disabled={logBusy}
                    style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8, minHeight: '1.25rem' }}>Time</span>
                  <input
                    type="time"
                    className="neon-input"
                    value={logForm.time}
                    onChange={(e) => setLogForm((f) => ({ ...f, time: e.target.value }))}
                    disabled={logBusy}
                    style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8, minHeight: '1.25rem' }}>Duration (Hours)</span>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    className="neon-input"
                    value={logForm.durationHours}
                    onChange={(e) => setLogForm((f) => ({ ...f, durationHours: e.target.value }))}
                    disabled={logBusy}
                    style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8, minHeight: '1.25rem' }}>Training Outcome</span>
                  <select
                    className="neon-input"
                    value={logForm.outcome}
                    onChange={(e) => setLogForm((f) => ({ ...f, outcome: e.target.value as 'completed' | 'needs_improvement' | 'failed' }))}
                    disabled={logBusy}
                    style={{ height: '40px', width: '100%', boxSizing: 'border-box', padding: '8px 12px' }}
                  >
                    <option value="completed">Completed - Satisfactory</option>
                    <option value="needs_improvement">Needs Improvement - Re-train Required</option>
                    <option value="failed">Failed - Must Re-train</option>
                  </select>
                </label>
              </div>

              {/* Outcome description */}
              {logForm.outcome && (
                <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "8px", marginLeft: "4px" }}>
                  {logForm.outcome === "completed" && "Training completed to satisfactory standard"}
                  {logForm.outcome === "needs_improvement" && "Training logged but requires additional practice"}
                  {logForm.outcome === "failed" && "Training not completed, immediate re-training needed"}
                </div>
              )}

              <label style={{ display: 'grid', gap: '4px' }}>
                <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>Notes</span>
                <textarea
                  rows={4}
                  className="neon-input"
                  value={logForm.notes}
                  onChange={(e) => setLogForm((f) => ({ ...f, notes: e.target.value }))}
                  disabled={logBusy}
                  placeholder="Key points covered, observed competency, follow-up actions..."
                />
              </label>

              {/* Translation Required Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap' }}>Translation Required?</span>
                  <select
                    className="neon-input"
                    value={logForm.translationRequired}
                    onChange={(e) => setLogForm((f) => ({
                      ...f,
                      translationRequired: e.target.value as 'yes' | 'no',
                      translationLanguage: e.target.value === 'no' ? '' : f.translationLanguage,
                      translatorName: e.target.value === 'no' ? '' : f.translatorName
                    }))}
                    disabled={logBusy}
                    style={{ width: '80px', height: '40px' }}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </label>

                {logForm.translationRequired === 'yes' && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', position: 'relative' }}>
                      <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>Language</span>
                      <div style={{ position: 'relative', width: '180px' }}>
                        <input
                          type="text"
                          className="neon-input"
                          value={logForm.translationLanguage}
                          onChange={(e) => handleLanguageInputChange(e.target.value)}
                          onBlur={() => setTimeout(() => setShowLanguageSuggestions(false), 200)}
                          onFocus={() => {
                            if (logForm.translationLanguage.trim().length > 0) {
                              const matches = commonLanguages.filter(lang =>
                                lang.toLowerCase().includes(logForm.translationLanguage.toLowerCase())
                              );
                              setLanguageSuggestions(matches);
                              setShowLanguageSuggestions(matches.length > 0);
                            }
                          }}
                          disabled={logBusy}
                          placeholder="Type a language..."
                          style={{ height: '40px', width: '100%' }}
                        />
                        {showLanguageSuggestions && languageSuggestions.length > 0 && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            backgroundColor: 'var(--field, #012b2b)',
                            border: '1px solid var(--neon)',
                            borderRadius: '4px',
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                          }}>
                            {languageSuggestions.map((lang, idx) => (
                              <div
                                key={idx}
                                onClick={() => handleLanguageSelect(lang)}
                                onMouseDown={(e) => e.preventDefault()}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  color: 'var(--text-white)',
                                  fontSize: '0.9rem',
                                  borderBottom: idx < languageSuggestions.length - 1 ? '1px solid rgba(64, 224, 208, 0.1)' : 'none',
                                  transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(64, 224, 208, 0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {lang}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>Translator Name</span>
                      <input
                        type="text"
                        className="neon-input"
                        value={logForm.translatorName}
                        onChange={(e) => setLogForm((f) => ({ ...f, translatorName: e.target.value }))}
                        disabled={logBusy}
                        placeholder="Enter translator's name..."
                        style={{ height: '40px', width: '200px' }}
                      />
                    </label>
                  </>
                )}
              </div>

              {/* Associated Tests Section */}
              {associatedTests.length > 0 && (
                <div style={{ display: 'grid', gap: '4px' }}>
                  <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>Associated Tests</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {associatedTests.map((test) => (
                      <div
                        key={test.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: test.passedAttempt ? 'var(--text-success)' : 'var(--text-error)',
                          backgroundColor: test.passedAttempt ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem' }}>{test.title}</span>
                          {test.passedAttempt && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', opacity: 0.9 }}>
                              <span style={{ color: 'var(--text-success)', fontWeight: 600 }}>✓ Passed</span>
                              <span style={{ opacity: 0.7 }}>•</span>
                              <span style={{ opacity: 0.7 }}>Score: {test.passedAttempt.score}%</span>
                              <span style={{ opacity: 0.7 }}>•</span>
                              <span style={{ opacity: 0.7 }}>
                                {new Date(test.passedAttempt.completedAt).toLocaleDateString()} {new Date(test.passedAttempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <TextIconButton
                            variant={test.passedAttempt ? "back" : "next"}
                            label={test.passedAttempt ? 'Retake Test' : 'Take Test'}
                            onClick={() => {
                              if (logTrainingData) {
                                setTestRunnerDialog({
                                  open: true,
                                  packId: test.id,
                                  userId: logTrainingData.userId,
                                });
                              }
                            }}
                            disabled={logBusy}
                            style={{ minWidth: '120px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Associated Documents Section */}
              {associatedDocuments.length > 0 && (
                <div style={{ display: 'grid', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>Associated Documents</span>
                    {logForm.outcome === 'completed' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-error)', fontWeight: 500 }}>* Required: Confirm all documents read</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {associatedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '8px',
                          border: `2px solid ${documentConfirmations[doc.id] ? 'var(--text-success)' : (logForm.outcome === 'completed' ? 'var(--text-error)' : 'var(--neon)')}`,
                          backgroundColor: documentConfirmations[doc.id] ? 'rgba(34, 197, 94, 0.1)' : 'rgba(64, 224, 208, 0.05)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.875rem' }}>{doc.title}</span>
                          <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Document #: {doc.reference_code}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {doc.file_url && (
                            <TextIconButton
                              variant="next"
                              label="View Document"
                              onClick={() => {
                                if (doc.file_url) {
                                  window.open(doc.file_url, '_blank');
                                }
                              }}
                              disabled={logBusy}
                              style={{ minWidth: '140px' }}
                            />
                          )}
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: (logBusy || documentConfirmations[doc.id]) ? 'not-allowed' : 'pointer',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            backgroundColor: documentConfirmations[doc.id] ? 'var(--text-success)' : 'rgba(64, 224, 208, 0.1)',
                            border: `1px solid ${documentConfirmations[doc.id] ? 'var(--text-success)' : 'var(--neon)'}`,
                            transition: 'all 0.2s',
                            minWidth: '150px',
                            justifyContent: 'center',
                            opacity: documentConfirmations[doc.id] ? 0.8 : 1
                          }}>
                            <input
                              type="checkbox"
                              checked={documentConfirmations[doc.id] || false}
                              onChange={(e) => {
                                if (!documentConfirmations[doc.id]) {
                                  setDocumentConfirmations(prev => ({
                                    ...prev,
                                    [doc.id]: e.target.checked
                                  }));
                                }
                              }}
                              disabled={logBusy || documentConfirmations[doc.id]}
                              style={{ cursor: (logBusy || documentConfirmations[doc.id]) ? 'not-allowed' : 'pointer' }}
                            />
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: documentConfirmations[doc.id] ? 'var(--text-success)' : 'var(--text-white)'
                            }}>
                              {documentConfirmations[doc.id] ? '✓ Already Read' : 'Confirm Read'}
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature fields - only shown for satisfactory completion */}
              {logForm.outcome === "completed" && (
                <>
                  {/* Learner E-signature field */}
                  <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>
                      Learner E-Signature *
                    </span>
                    <SignatureBox
                      disabled={logBusy}
                      onChange={handleLearnerSignatureChange}
                    />
                  </div>

                  {/* Trainer E-signature field */}
                  <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                    <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>
                      Trainer E-Signature *
                    </span>
                    <SignatureBox
                      disabled={logBusy}
                      onChange={handleTrainerSignatureChange}
                    />
                  </div>

                  {/* Translator E-signature field - only shown when translation was required */}
                  {logForm.translationRequired === 'yes' && (
                    <div style={{ display: 'grid', gap: '8px', marginTop: '12px' }}>
                      <span style={{ fontSize: '1rem', fontFamily: 'var(--font-body)', fontWeight: 500, opacity: 0.8 }}>
                        Translator E-Signature *
                      </span>
                      <SignatureBox
                        disabled={logBusy}
                        onChange={handleTranslatorSignatureChange}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Info message for unsatisfactory outcomes */}
              {(logForm.outcome === "needs_improvement" || logForm.outcome === "failed") && (
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
            </NeonForm>
          </div>
        </div>
      </OverlayDialog>

      {/* Test Runner Dialog */}
      <OverlayDialog
        open={testRunnerDialog.open}
        onClose={async () => {
          setTestRunnerDialog({ open: false, packId: null, userId: null });
          // Refresh test status when dialog closes
          if (logTrainingData?.moduleId && logTrainingData?.userId) {
            await fetchAssociatedTests(logTrainingData.moduleId, logTrainingData.userId);
          }
        }}
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
                onReturnToLog={async () => {
                  setTestRunnerDialog({ open: false, packId: null, userId: null });
                  // Refresh test status when returning to log
                  if (logTrainingData?.moduleId && logTrainingData?.userId) {
                    await fetchAssociatedTests(logTrainingData.moduleId, logTrainingData.userId);
                  }
                }}
              />
            )}
          </div>
        </div>
      </OverlayDialog>

      {/* Test Results Viewer Dialog */}
      <OverlayDialog
        open={showTestResults}
        onClose={() => setShowTestResults(false)}
        width={1400}
        showCloseButton
        compactHeight
      >
        <div className="ui-dialog-container">
          <div className="ui-dialog-scrollable">
            <TrainingTestResults />
          </div>
        </div>
      </OverlayDialog>

      {/* Training Matrix Dialog */}
      <OverlayDialog
        open={showTrainingMatrix}
        onClose={() => setShowTrainingMatrix(false)}
        width={1400}
        showCloseButton
        compactHeight
      >
        <div className="ui-dialog-container">
          <div className="ui-dialog-scrollable">
            <TrainingMatrix />
          </div>
        </div>
      </OverlayDialog>

      {/* Modules Viewer Dialog */}
      <OverlayDialog
        open={showModulesDialog}
        onClose={() => {
          setShowModulesDialog(false);
          setModulesSearch('');
        }}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ paddingBottom: '8px', borderBottom: '2px solid var(--neon)', marginBottom: '24px' }}>
            Training Modules
          </h2>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search modules by name, description, objectives..."
              value={modulesSearch}
              onChange={(e) => setModulesSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(var(--neon-rgb), 0.3)',
                borderRadius: '4px',
                color: 'var(--text-white)',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {modulesLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
              <p style={{ marginTop: '16px', color: 'var(--text-white)' }}>Loading modules...</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {modulesData
                .filter((module) => {
                  if (!modulesSearch.trim()) return true;
                  const search = modulesSearch.toLowerCase();
                  return (
                    module.name?.toLowerCase().includes(search) ||
                    module.ref_code?.toLowerCase().includes(search) ||
                    module.description?.toLowerCase().includes(search) ||
                    module.learning_objectives?.toLowerCase().includes(search)
                  );
                })
                .map((module) => (
                  <div
                    key={module.id}
                    style={{
                      padding: '20px',
                      marginBottom: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(var(--neon-rgb), 0.2)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h3 style={{ color: 'var(--neon)', fontSize: '1.1rem', margin: 0 }}>
                        {module.name}
                      </h3>
                      {module.ref_code && (
                        <span
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'rgba(var(--neon-rgb), 0.1)',
                            border: '1px solid rgba(var(--neon-rgb), 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            color: 'var(--neon)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {module.ref_code}
                        </span>
                      )}
                    </div>

                    {module.description && (
                      <p style={{ color: 'var(--text-white)', opacity: 0.8, marginBottom: '12px' }}>
                        {module.description}
                      </p>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                      {module.estimated_duration && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Duration:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{module.estimated_duration}</p>
                        </div>
                      )}
                      {module.delivery_format && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Format:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{module.delivery_format}</p>
                        </div>
                      )}
                      {module.target_audience && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Target Audience:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{module.target_audience}</p>
                        </div>
                      )}
                    </div>

                    {module.learning_objectives && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Learning Objectives:</strong>
                        <p style={{ color: 'var(--text-white)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                          {module.learning_objectives}
                        </p>
                      </div>
                    )}

                    {module.prerequisites && module.prerequisites.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Prerequisites:</strong>
                        <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {module.prerequisites.map((prereq: string, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: 'rgba(var(--neon-rgb), 0.1)',
                                border: '1px solid rgba(var(--neon-rgb), 0.3)',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: 'var(--text-white)'
                              }}
                            >
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {module.attachments && module.attachments.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Attachments:</strong>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {module.attachments.map((attachment: any, idx: number) => (
                            <a
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                padding: '8px 12px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(var(--neon-rgb), 0.3)',
                                borderRadius: '4px',
                                color: 'var(--neon)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(var(--neon-rgb), 0.1)';
                                e.currentTarget.style.borderColor = 'var(--neon)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'rgba(var(--neon-rgb), 0.3)';
                              }}
                            >
                              <FiDownload size={16} />
                              <span>{attachment.name}</span>
                              {attachment.size && (
                                <span style={{ opacity: 0.6, fontSize: '0.85rem', marginLeft: 'auto' }}>
                                  ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {(module.requires_follow_up || module.refresh_period !== 'Never') && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '16px' }}>
                        {module.requires_follow_up && (
                          <div>
                            <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Follow-up Period:</strong>
                            <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{module.follow_up_period || 'N/A'}</p>
                          </div>
                        )}
                        {module.refresh_period && module.refresh_period !== 'Never' && (
                          <div>
                            <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Refresh Period:</strong>
                            <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{module.refresh_period}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {modulesData.filter((module) => {
                if (!modulesSearch.trim()) return true;
                const search = modulesSearch.toLowerCase();
                return (
                  module.name?.toLowerCase().includes(search) ||
                  module.ref_code?.toLowerCase().includes(search) ||
                  module.description?.toLowerCase().includes(search) ||
                  module.learning_objectives?.toLowerCase().includes(search)
                );
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-white)', opacity: 0.6 }}>
                  {modulesSearch ? 'No modules found matching your search.' : 'No modules available.'}
                </div>
              )}
            </div>
          )}
        </div>
      </OverlayDialog>

      {/* Documents Viewer Dialog */}
      <OverlayDialog
        open={showDocumentsDialog}
        onClose={() => {
          setShowDocumentsDialog(false);
          setDocumentsSearch('');
        }}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ paddingBottom: '8px', borderBottom: '2px solid var(--neon)', marginBottom: '24px' }}>
            Training Documents
          </h2>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Search documents by title, reference code, notes..."
              value={documentsSearch}
              onChange={(e) => setDocumentsSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(var(--neon-rgb), 0.3)',
                borderRadius: '4px',
                color: 'var(--text-white)',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {documentsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
              <p style={{ marginTop: '16px', color: 'var(--text-white)' }}>Loading documents...</p>
            </div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {documentsData
                .filter((doc) => {
                  if (!documentsSearch.trim()) return true;
                  const search = documentsSearch.toLowerCase();
                  return (
                    doc.title?.toLowerCase().includes(search) ||
                    doc.reference_code?.toLowerCase().includes(search) ||
                    doc.notes?.toLowerCase().includes(search)
                  );
                })
                .map((doc: any) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '20px',
                      marginBottom: '16px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(var(--neon-rgb), 0.2)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <h3 style={{ color: 'var(--neon)', fontSize: '1.1rem', margin: 0 }}>
                        {doc.title}
                      </h3>
                      {doc.reference_code && (
                        <span
                          style={{
                            padding: '4px 12px',
                            backgroundColor: 'rgba(var(--neon-rgb), 0.1)',
                            border: '1px solid rgba(var(--neon-rgb), 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            color: 'var(--neon)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {doc.reference_code}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '12px' }}>
                      {doc.document_types && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Type:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{doc.document_types.name}</p>
                        </div>
                      )}
                      {doc.current_version && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Version:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{doc.current_version}</p>
                        </div>
                      )}
                      {doc.location && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Location:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{doc.location}</p>
                        </div>
                      )}
                      {doc.review_period_months && (
                        <div>
                          <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Review Period:</strong>
                          <p style={{ color: 'var(--text-white)', marginTop: '4px' }}>{doc.review_period_months} months</p>
                        </div>
                      )}
                    </div>

                    {doc.notes && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Notes:</strong>
                        <p style={{ color: 'var(--text-white)', marginTop: '4px', opacity: 0.8 }}>
                          {doc.notes}
                        </p>
                      </div>
                    )}

                    {doc.document_modules && doc.document_modules.length > 0 && (
                      <div style={{ marginTop: '12px' }}>
                        <strong style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.85rem' }}>Linked Modules:</strong>
                        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {doc.document_modules.map((dm: any, idx: number) => (
                            <span
                              key={idx}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(var(--neon-rgb), 0.1)',
                                border: '1px solid rgba(var(--neon-rgb), 0.3)',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                color: 'var(--text-white)'
                              }}
                            >
                              {dm.modules?.name || 'Unknown Module'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {doc.file_url && (
                      <div style={{ marginTop: '16px' }}>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            backgroundColor: 'rgba(var(--neon-rgb), 0.1)',
                            border: '1px solid var(--neon)',
                            borderRadius: '4px',
                            color: 'var(--neon)',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--neon)';
                            e.currentTarget.style.color = '#000';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(var(--neon-rgb), 0.1)';
                            e.currentTarget.style.color = 'var(--neon)';
                          }}
                        >
                          <FiDownload size={18} />
                          View Document
                        </a>
                      </div>
                    )}

                    {(doc.created_at || doc.last_reviewed_at) && (
                      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(var(--neon-rgb), 0.2)', display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-white)', opacity: 0.6 }}>
                        {doc.created_at && (
                          <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                        )}
                        {doc.last_reviewed_at && (
                          <span>Last Reviewed: {new Date(doc.last_reviewed_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              {documentsData.filter((doc) => {
                if (!documentsSearch.trim()) return true;
                const search = documentsSearch.toLowerCase();
                return (
                  doc.title?.toLowerCase().includes(search) ||
                  doc.reference_code?.toLowerCase().includes(search) ||
                  doc.notes?.toLowerCase().includes(search)
                );
              }).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-white)', opacity: 0.6 }}>
                  {documentsSearch ? 'No documents found matching your search.' : 'No documents available.'}
                </div>
              )}
            </div>
          )}
        </div>
      </OverlayDialog>

      {/* Department Detail Dialog */}
      <OverlayDialog
        open={departmentDialogType !== null}
        onClose={() => {
          setDepartmentDialogType(null);
          setSelectedDepartment(null);
        }}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="neon-heading" style={{ paddingBottom: '8px', borderBottom: '2px solid #f59e0b', margin: 0 }}>
              {selectedDepartment?.name} - {
                departmentDialogType === 'users' ? 'Users' :
                departmentDialogType === 'completed' ? 'Completed Assignments' :
                departmentDialogType === 'incomplete' ? 'Incomplete Assignments' :
                departmentDialogType === 'upcoming-refresh' ? 'Upcoming Refresh Assessments' :
                'All Assignments'
              }
            </h2>
            <TextIconButton
              variant="download"
              label="Download CSV"
              onClick={downloadDepartmentCSV}
              title="Download as CSV"
            />
          </div>

          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : departmentDialogType === 'users' ? (
            <NeonTable
              columns={[
                { header: 'Name', accessor: 'name', width: 200 },
                { header: 'Emp #', accessor: 'empNumber', width: 120 },
                { header: 'Total Assignments', accessor: 'totalAssignments', width: 150, align: 'center' },
                { header: 'Completed', accessor: 'completedAssignments', width: 120, align: 'center' },
                {
                  header: 'Compliance Rate',
                  accessor: 'complianceRate',
                  width: 150,
                  align: 'center',
                  render: (value) => {
                    const rate = value as number;
                    return (
                      <span style={{
                        color: rate >= 80 ? 'var(--text-success)' : rate >= 50 ? '#f59e0b' : 'var(--text-error)',
                        fontWeight: 'bold'
                      }}>
                        {rate.toFixed(1)}%
                      </span>
                    );
                  }
                },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          ) : departmentDialogType === 'upcoming-refresh' ? (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Item', accessor: 'moduleName', width: 250 },
                {
                  header: 'Type',
                  accessor: 'itemType',
                  width: 100,
                  align: 'center' as const,
                  render: (value) => (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: value === 'module' ? '#1e3a8a' : '#7c3aed',
                      color: 'white'
                    }}>
                      {value === 'module' ? 'Module' : 'Document'}
                    </span>
                  )
                },
                { header: 'Due Date', accessor: 'dueDate', width: 130 },
                {
                  header: 'Status',
                  accessor: 'status',
                  width: 120,
                  render: (value) => (
                    <span style={{
                      color: '#f59e0b',
                      fontWeight: 'bold'
                    }}>
                      {value as string}
                    </span>
                  )
                },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          ) : (
            <NeonTable
              columns={[
                { header: 'Emp #', accessor: 'empNumber', width: 100 },
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Item', accessor: 'moduleName', width: 250 },
                {
                  header: 'Type',
                  accessor: 'itemType',
                  width: 100,
                  align: 'center' as const,
                  render: (value) => (
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: value === 'module' ? '#1e3a8a' : '#7c3aed',
                      color: 'white'
                    }}>
                      {value === 'module' ? 'Module' : 'Document'}
                    </span>
                  )
                },
                { header: 'Assigned', accessor: 'assignedAt', width: 120 },
                { header: 'Completed', accessor: 'completedAt', width: 120 },
                {
                  header: 'Status',
                  accessor: 'status',
                  width: 120,
                  render: (value) => (
                    <span style={{
                      color: value === 'Completed' ? 'var(--text-success)' : 'var(--text-error)',
                      fontWeight: 'bold'
                    }}>
                      {value as string}
                    </span>
                  )
                },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
          )}
        </div>
      </OverlayDialog>

      {/* Download Format Selection Dialog */}
      <OverlayDialog
        open={showDownloadFormatDialog}
        onClose={() => setShowDownloadFormatDialog(false)}
        width={500}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px', paddingBottom: '8px', borderBottom: '2px solid #f59e0b' }}>
            Choose Download Format
          </h2>
          <p style={{ marginBottom: '24px', color: 'var(--text-white)', opacity: 0.8 }}>
            Select the format for downloading <strong>{selectedUser?.name}'s</strong> training record:
          </p>
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            <button
              className="neon-btn"
              onClick={downloadTrainingRecordPDF}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px',
                fontSize: '1rem',
                width: '100%'
              }}
            >
              <FiFileText size={20} />
              <span>Download as PDF</span>
            </button>
            <button
              className="neon-btn"
              onClick={downloadTrainingRecordCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '16px',
                fontSize: '1rem',
                width: '100%'
              }}
            >
              <FiDownload size={20} />
              <span>Download as CSV</span>
            </button>
          </div>
        </div>
      </OverlayDialog>

      {/* Success Modal */}
      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        title="Success"
        message={successModal.message}
        autoCloseMs={3000}
      />

      {/* Document Confirmation Dialog */}
      <TrainingDocumentConfirmation
        data={documentConfirmationData}
        onClose={() => setDocumentConfirmationData(null)}
        onConfirm={handleConfirmDocument}
      />

      {/* Training Record Dialog for PDF Download */}
      <TrainingRecord
        open={showTrainingRecordDialog}
        onClose={() => setShowTrainingRecordDialog(false)}
        trainingData={selectedUser ? {
          assignmentId: '',
          authId: selectedUser.id,
          userId: selectedUser.id,
          userName: selectedUser.name,
          moduleId: '',
          moduleName: ''
        } : null}
      />
    </>
  );
}
