"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiUsers, FiCheckCircle, FiAlertCircle, FiClock, FiTrendingUp, FiRefreshCw, FiDownload } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import ContentHeader from "@/components/ui/ContentHeader";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";

/* ===========================
   TRAINING DASHBOARD
   Overview of training compliance for trainers
=========================== */

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
  name: string;
  email: string;
  department: string;
  totalAssignments: number;
  completedAssignments: number;
  complianceRate: number;
}

interface AssignmentDetail {
  id: string;
  userName: string;
  userEmail: string;
  moduleName: string;
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

  const fetchComplianceData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching training compliance data...');

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
          follow_up_required,
          follow_up_due_date,
          follow_up_completed_at
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

      const followUpRequired = assignmentsData?.filter(a => a.follow_up_required && a.follow_up_due_date) || [];
      const today = new Date();
      const upcomingFollowUps = followUpRequired.filter(a => {
        if (a.follow_up_completed_at) return false;
        const dueDate = new Date(a.follow_up_due_date);
        return dueDate > today;
      }).length;
      const overdueFollowUps = followUpRequired.filter(a => {
        if (a.follow_up_completed_at) return false;
        const dueDate = new Date(a.follow_up_due_date);
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

      console.log('✅ Compliance data loaded successfully');
    } catch (err) {
      console.error('❌ Error fetching compliance data:', err);
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
        .select('id, auth_id, first_name, last_name, email, department_id, departments(name)');

      if (usersError) throw usersError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('user_assignments')
        .select('auth_id, completed_at')
        .eq('item_type', 'module');

      if (assignmentsError) throw assignmentsError;

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
          name: `${u.first_name} ${u.last_name}`,
          email: u.email || 'N/A',
          department: (u.departments as any)?.name || 'N/A',
          totalAssignments: stats.total,
          completedAssignments: stats.completed,
          complianceRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        };
      }) || [];

      setDialogData(details);
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
        .select('auth_id, first_name, last_name, email');

      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, name');

      const userMap = new Map(usersData?.map(u => [u.auth_id, u]) || []);
      const moduleMap = new Map(modulesData?.map(m => [m.id, m.name]) || []);

      const details: AssignmentDetail[] = filtered?.map(a => {
        const user = userMap.get(a.auth_id);
        return {
          id: a.id,
          userName: user ? `${user.first_name} ${user.last_name}` : 'Unknown',
          userEmail: user?.email || 'N/A',
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
        .select('id, auth_id, item_id, follow_up_due_date, follow_up_completed_at')
        .eq('item_type', 'module')
        .eq('follow_up_required', true)
        .not('follow_up_due_date', 'is', null);

      if (assignmentsError) throw assignmentsError;

      const today = new Date();
      const filtered = assignmentsData?.filter(a => {
        if (a.follow_up_completed_at) return false;
        const dueDate = new Date(a.follow_up_due_date);
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
        dueDate: new Date(a.follow_up_due_date).toLocaleDateString(),
        completedAt: a.follow_up_completed_at ? new Date(a.follow_up_completed_at).toLocaleDateString() : undefined,
        status: a.follow_up_completed_at ? 'Completed' : type === 'overdue' ? 'Overdue' : 'Upcoming',
      })) || [];

      setDialogData(details);
    } catch (err) {
      console.error('Error fetching follow-ups detail:', err);
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

          <CustomTooltip text="Refresh data now">
            <button
              className="neon-btn neon-btn-save"
              onClick={fetchComplianceData}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            </button>
          </CustomTooltip>

          <CustomTooltip text="Download compliance report">
            <button
              className="neon-btn neon-btn-view"
              onClick={downloadComplianceReport}
            >
              <FiDownload />
            </button>
          </CustomTooltip>

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
          <div className="neon-table">
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
          </div>
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
          <div className="neon-table">
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
          </div>
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
                { header: 'Email', accessor: 'email', width: 250 },
                { header: 'Department', accessor: 'department', width: 180 },
                { header: 'Total Assignments', accessor: 'totalAssignments', width: 150 },
                { header: 'Completed', accessor: 'completedAssignments', width: 120 },
                {
                  header: 'Compliance Rate',
                  accessor: 'complianceRate',
                  width: 150,
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
        onClose={() => setDialogOpen(null)}
        width={1200}
        showCloseButton
      >
        <div style={{ padding: '24px' }}>
          <h2 className="neon-heading" style={{ marginBottom: '24px' }}>Incomplete Assignments</h2>
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
                { header: 'Status', accessor: 'status', width: 120 },
              ]}
              data={dialogData as unknown as Record<string, unknown>[]}
            />
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
    </>
  );
}
