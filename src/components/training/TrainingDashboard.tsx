"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp, FiRefreshCw, FiDownload, FiX } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import SignaturePad from "react-signature-canvas";
import NeonForm from "@/components/NeonForm";
import TestRunner from "@/components/training/TestRunner";

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
  complianceRate: number;
}

interface ModuleStats {
  moduleId: string;
  moduleName: string;
  totalAssignments: number;
  completedAssignments: number;
  complianceRate: number;
}

interface RecentActivity {
  userName: string;
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
  assignedAt: string;
  completedAt?: string;
  status: string;
}

interface FollowUpDetail {
  id: string;
  userName: string;
  moduleName: string;
  dueDate: string;
  completedAt?: string;
  status: string;
}

export default function TrainingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [moduleStats, setModuleStats] = useState<ModuleStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<UserDetail[] | AssignmentDetail[] | FollowUpDetail[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [incompleteSearchQuery, setIncompleteSearchQuery] = useState('');

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

  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching training compliance data...');

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, auth_id, first_name, last_name, department_id');

      if (usersError) throw usersError;

      // Fetch all user assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
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
        .eq('item_type', 'module');

      if (assignmentsError) throw assignmentsError;

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

      // Calculate overall compliance stats
      const totalAssignments = assignmentsData?.length || 0;
      const completedAssignments = assignmentsData?.filter(a => a.completed_at)?.length || 0;
      const overdueAssignments = assignmentsData?.filter(a => !a.completed_at)?.length || 0;

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

      // Calculate department stats
      const deptMap = new Map(departmentsData?.map(d => [d.id, d.name]) || []);
      const userDeptMap = new Map(usersData?.map(u => [u.auth_id, u.department_id]) || []);

      const deptStatsMap = new Map<string, DepartmentStats>();

      assignmentsData?.forEach(assignment => {
        const deptId = userDeptMap.get(assignment.auth_id);
        if (!deptId) return;

        const deptName = deptMap.get(deptId) || 'Unknown Department';

        if (!deptStatsMap.has(deptId)) {
          deptStatsMap.set(deptId, {
            departmentId: deptId,
            departmentName: deptName,
            totalUsers: usersData?.filter(u => u.department_id === deptId).length || 0,
            totalAssignments: 0,
            completedAssignments: 0,
            complianceRate: 0,
          });
        }

        const stats = deptStatsMap.get(deptId)!;
        stats.totalAssignments++;
        if (assignment.completed_at) {
          stats.completedAssignments++;
        }
      });

      // Calculate compliance rates
      deptStatsMap.forEach(stats => {
        stats.complianceRate = stats.totalAssignments > 0
          ? (stats.completedAssignments / stats.totalAssignments) * 100
          : 0;
      });

      setDepartmentStats(Array.from(deptStatsMap.values()).sort((a, b) => b.complianceRate - a.complianceRate));

      // Calculate module stats
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);
      const moduleStatsMap = new Map<string, ModuleStats>();

      assignmentsData?.forEach(assignment => {
        const moduleId = assignment.item_id;
        const moduleName = moduleMap.get(moduleId) || 'Unknown Module';

        if (!moduleStatsMap.has(moduleId)) {
          moduleStatsMap.set(moduleId, {
            moduleId,
            moduleName,
            totalAssignments: 0,
            completedAssignments: 0,
            complianceRate: 0,
          });
        }

        const stats = moduleStatsMap.get(moduleId)!;
        stats.totalAssignments++;
        if (assignment.completed_at) {
          stats.completedAssignments++;
        }
      });

      // Calculate compliance rates for modules
      moduleStatsMap.forEach(stats => {
        stats.complianceRate = stats.totalAssignments > 0
          ? (stats.completedAssignments / stats.totalAssignments) * 100
          : 0;
      });

      setModuleStats(Array.from(moduleStatsMap.values()).sort((a, b) => a.complianceRate - b.complianceRate).slice(0, 10));

      // Fetch recent activity (last 10 completions)
      const recentCompletions = assignmentsData
        ?.filter(a => a.completed_at)
        .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())
        .slice(0, 10) || [];

      const userMap = new Map(usersData?.map(u => [u.auth_id, `${u.first_name} ${u.last_name}`]) || []);

      const activity: RecentActivity[] = recentCompletions.map(completion => ({
        userName: userMap.get(completion.auth_id) || 'Unknown User',
        moduleName: moduleMap.get(completion.item_id) || 'Unknown Module',
        completedAt: completion.completed_at!,
        type: 'completion' as const,
      }));

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
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('user_assignments')
          .select('auth_id, completed_at, item_type')
          .in('item_type', ['module', 'document'])
          .in('auth_id', authIds);

        if (assignmentsError) throw assignmentsError;

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
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select('id, auth_id, item_id, assigned_at, completed_at')
        .eq('item_type', 'module');

      if (assignmentsError) throw assignmentsError;

      const filtered = type === 'completed'
        ? assignmentsData?.filter(a => a.completed_at)
        : assignmentsData?.filter(a => !a.completed_at);

      const { data: usersData } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, email, employee_number');

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, name');

      const userMap = new Map(usersData?.map(u => [u.auth_id, u]) || []);
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);

      const details: AssignmentDetail[] = filtered?.map(a => {
        const user = userMap.get(a.auth_id);
        return {
          id: a.id,
          authId: a.auth_id,
          moduleId: a.item_id,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'N/A',
          empNumber: user?.employee_number || 'N/A',
          moduleName: moduleMap.get(a.item_id) || 'Unknown',
          assignedAt: new Date(a.assigned_at).toLocaleDateString(),
          completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : undefined,
          status: a.completed_at ? 'Completed' : 'Incomplete',
        };
      }) || [];

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
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select('id, auth_id, item_id, follow_up_assessment_due_date, follow_up_assessment_completed_at')
        .eq('item_type', 'module')
        .eq('follow_up_assessment_required', true)
        .not('follow_up_assessment_due_date', 'is', null);

      if (assignmentsError) throw assignmentsError;

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

      const userMap = new Map(usersData?.map(u => [u.auth_id, `${u.first_name} ${u.last_name}`]) || []);
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);

      const details: FollowUpDetail[] = filtered?.map(a => ({
        id: a.id,
        userName: userMap.get(a.auth_id) || 'Unknown',
        moduleName: moduleMap.get(a.item_id) || 'Unknown',
        dueDate: new Date(a.follow_up_assessment_due_date).toLocaleDateString(),
        completedAt: a.follow_up_assessment_completed_at ? new Date(a.follow_up_assessment_completed_at).toLocaleDateString() : undefined,
        status: a.follow_up_assessment_completed_at ? 'Completed' : type === 'overdue' ? 'Overdue' : 'Upcoming',
      })) || [];

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

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select('id, auth_id, item_id, assigned_at, completed_at')
        .eq('item_type', 'module')
        .eq('auth_id', authId);

      if (assignmentsError) throw assignmentsError;

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

      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);

      // Filter based on type
      let filteredData = assignmentsData || [];
      if (filterType === 'completed') {
        filteredData = filteredData.filter(a => a.completed_at);
      } else if (filterType === 'incomplete') {
        filteredData = filteredData.filter(a => !a.completed_at);
      }

      console.log(`After filtering (${filterType}): ${filteredData.length} assignments`);

      const details: AssignmentDetail[] = filteredData.map(a => ({
        id: a.id,
        userName: userName,
        userEmail: '',
        empNumber: userData?.employee_number || 'N/A',
        moduleName: moduleMap.get(a.item_id) || 'Unknown',
        assignedAt: new Date(a.assigned_at).toLocaleDateString(),
        completedAt: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : undefined,
        status: a.completed_at ? 'Completed' : 'Incomplete',
      }));

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

    // Fetch associated tests for the module
    await fetchAssociatedTests(assignment.moduleId, userData.id);

    setLogTrainingOpen(true);
  };

  const handleSubmitLogTraining = async () => {
    if (!logTrainingData) return;

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
        training_outcome: logForm.outcome
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

      // Success message
      alert(`Training logged successfully for ${logTrainingData.userName}`);

      // Close dialog and refresh data
      setLogTrainingOpen(false);
      setLogTrainingData(null);

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
    rows.push('Department,Total Users,Total Assignments,Completed,Compliance Rate');
    departmentStats.forEach(dept => {
      rows.push(`${dept.departmentName},${dept.totalUsers},${dept.totalAssignments},${dept.completedAssignments},${dept.complianceRate.toFixed(1)}%`);
    });
    rows.push('');

    // Module stats
    rows.push('MODULE COMPLIANCE (Bottom 10)');
    rows.push('Module,Total Assignments,Completed,Compliance Rate');
    moduleStats.forEach(mod => {
      rows.push(`${mod.moduleName},${mod.totalAssignments},${mod.completedAssignments},${mod.complianceRate.toFixed(1)}%`);
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
      >
        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
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
      </ContentHeader>

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
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
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
                  Compliance Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((dept) => (
                <tr key={dept.departmentId} style={{ borderBottom: '1px solid rgba(64, 224, 208, 0.18)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-white)' }}>{dept.departmentName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{dept.totalUsers}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{dept.totalAssignments}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{dept.completedAssignments}</td>
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

      {/* Module Compliance (Bottom 10) */}
      <div className="neon-panel" style={{ marginBottom: '32px' }}>
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
          Modules Needing Attention (Lowest Compliance)
        </h2>
        {moduleStats.length === 0 ? (
          <div className="empty-state">No module data available</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid var(--neon)', color: 'var(--header-text)' }}>
                  Module
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
              {moduleStats.map((mod) => (
                <tr key={mod.moduleId} style={{ borderBottom: '1px solid rgba(64, 224, 208, 0.18)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-white)' }}>{mod.moduleName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{mod.totalAssignments}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-white)' }}>{mod.completedAssignments}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      color: mod.complianceRate >= 80 ? 'var(--text-success)' : mod.complianceRate >= 50 ? '#f59e0b' : 'var(--text-error)',
                      fontWeight: 'bold'
                    }}>
                      {mod.complianceRate.toFixed(1)}%
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
        <h2 className="neon-heading" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
          Recent Training Completions
        </h2>
        {recentActivity.length === 0 ? (
          <div className="empty-state">No recent activity</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentActivity.map((activity, idx) => (
              <div
                key={idx}
                className="user-list-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  background: 'rgba(64, 224, 208, 0.05)',
                  borderRadius: '8px'
                }}
              >
                <FiCheckCircle size={20} style={{ color: 'var(--text-success)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'var(--text-white)', fontWeight: 500 }}>
                    {activity.userName}
                  </div>
                  <div style={{ color: 'var(--text-white)', opacity: 0.7, fontSize: '0.9rem' }}>
                    {activity.moduleName}
                  </div>
                </div>
                <div style={{ color: 'var(--text-white)', opacity: 0.6, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                  {new Date(activity.completedAt).toLocaleDateString()} {new Date(activity.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <OverlayDialog
        open={dialogOpen === 'users'}
        onClose={() => setDialogOpen(null)}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>All Users</h2>
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
              data={dialogData as unknown as Record<string, unknown>[]}
            />
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
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>Completed Assignments</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Email', accessor: 'userEmail', width: 250 },
                { header: 'Module', accessor: 'moduleName', width: 250 },
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
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>Incomplete Assignments</h2>

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
                { header: 'Module', accessor: 'moduleName', width: 250 },
                { header: 'Assigned', accessor: 'assignedAt', width: 130 },
                { header: 'Status', accessor: 'status', width: 100 },
                {
                  header: 'Actions',
                  accessor: 'id',
                  width: 120,
                  render: (_value, row) => {
                    const assignment = row as unknown as AssignmentDetail;
                    return (
                      <TextIconButton
                        variant="edit"
                        label="Log Training"
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
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>Upcoming Follow-ups</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Module', accessor: 'moduleName', width: 300 },
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
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>Overdue Follow-ups</h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'User Name', accessor: 'userName', width: 200 },
                { header: 'Module', accessor: 'moduleName', width: 300 },
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
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>
            Assignments for {selectedUser?.name}
          </h2>
          {dialogLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <FiRefreshCw className="animate-spin" size={32} style={{ color: 'var(--neon)' }} />
            </div>
          ) : (
            <NeonTable
              columns={[
                { header: 'Module', accessor: 'moduleName', width: 350 },
                { header: 'Assigned', accessor: 'assignedAt', width: 130 },
                { header: 'Completed', accessor: 'completedAt', width: 130 },
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
    </>
  );
}
