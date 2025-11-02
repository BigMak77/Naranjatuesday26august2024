"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiCheckCircle, FiAlertCircle, FiClock, FiHash, FiX } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";

interface DepartmentTrainingStats {
  totalAssignments: number;
  completedAssignments: number;
  incompleteAssignments: number;
  overdueAssignments: number;
  complianceRate: number;
}

interface AssignmentData {
  id: string;
  team_member: string;
  item_name: string;
  item_type: string;
  status: string;
  assigned_at: string;
  due_date?: string;
  completed_at?: string;
}

interface Props {
  departmentId: string;
  departmentName: string;
}

export default function DepartmentTrainingWidget({ departmentId, departmentName }: Props) {
  const [stats, setStats] = useState<DepartmentTrainingStats>({
    totalAssignments: 0,
    completedAssignments: 0,
    incompleteAssignments: 0,
    overdueAssignments: 0,
    complianceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<'total' | 'completed' | 'pending' | 'overdue' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState<AssignmentData[]>([]);

  // Filter data based on selected card
  const getFilteredData = () => {
    if (!activeCard) return [];
    
    const now = new Date();
    
    switch (activeCard) {
      case 'total':
        return assignmentData;
      case 'completed':
        return assignmentData.filter(item => item.status === 'Completed');
      case 'pending':
        return assignmentData.filter(item => item.status === 'Pending');
      case 'overdue':
        return assignmentData.filter(item => 
          item.status === 'Pending' && 
          item.due_date && 
          new Date(item.due_date) < now
        );
      default:
        return [];
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchDepartmentTrainingStats = async () => {
      if (!departmentId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('DepartmentTrainingWidget - Fetching team training for department:', departmentId);
        
        // First, get users in the same department (same logic as MyTeamTraining)
        const { data: departmentUsers, error: usersError } = await supabase
          .from("users")
          .select("auth_id, first_name, last_name")
          .eq("department_id", departmentId);
        
        if (!isMounted) return;

        if (usersError) {
          console.error('Error fetching department users:', usersError);
          setError(usersError.message);
          setLoading(false);
          return;
        }
        
        console.log('Department users found:', departmentUsers?.length || 0);
        
        const userAuthIds = departmentUsers?.map(u => u.auth_id) || [];
        
        if (userAuthIds.length === 0) {
          if (isMounted) {
            setStats({
              totalAssignments: 0,
              completedAssignments: 0,
              incompleteAssignments: 0,
              overdueAssignments: 0,
              complianceRate: 0,
            });
          }
          return;
        }
        
        // Get all assignments for team members (training-related) - same logic as MyTeamTraining
        const { data: assignments, error: assignmentsError } = await supabase
          .from("user_assignments")
          .select("id, auth_id, item_id, item_type, completed_at, due_at, assigned_at")
          .in("auth_id", userAuthIds)
          .in("item_type", ["module", "document"]);

        if (!isMounted) return;

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          setError(assignmentsError.message);
          setLoading(false);
          return;
        }

        console.log('Training assignments found:', assignments?.length || 0);

        const allAssignments = assignments || [];
        
        // Get item details (modules and documents) for display names
        const moduleIds = allAssignments?.filter(a => a.item_type === 'module').map(a => a.item_id) || [];
        const documentIds = allAssignments?.filter(a => a.item_type === 'document').map(a => a.item_id) || [];
        
        let moduleDetails: any[] = [];
        let documentDetails: any[] = [];
        
        if (moduleIds.length > 0) {
          const { data: modules, error: moduleError } = await supabase
            .from("training_modules")
            .select("id, module_name")
            .in("id", moduleIds);
          
          if (!moduleError) {
            moduleDetails = modules || [];
          }
        }
        
        if (documentIds.length > 0) {
          const { data: documents, error: docError } = await supabase
            .from("documents")
            .select("id, document_title")
            .in("id", documentIds);
          
          if (!docError) {
            documentDetails = documents || [];
          }
        }
        
        // Create lookup maps
        const userLookup = new Map();
        departmentUsers?.forEach(user => {
          userLookup.set(user.auth_id, `${user.first_name || ''} ${user.last_name || ''}`.trim());
        });
        
        const moduleLookup = new Map();
        moduleDetails.forEach(module => {
          moduleLookup.set(module.id, module.module_name);
        });
        
        const documentLookup = new Map();
        documentDetails.forEach(doc => {
          documentLookup.set(doc.id, doc.document_title);
        });
        
        // Transform assignments for table display
        const transformedAssignments: AssignmentData[] = allAssignments.map((item: any) => {
          const itemName = item.item_type === 'module'
            ? moduleLookup.get(item.item_id) || `Module ${item.item_id}`
            : documentLookup.get(item.item_id) || `Document ${item.item_id}`;

          const status = item.completed_at ? 'Completed' : 'Pending';
          const assignedDate = item.assigned_at ? new Date(item.assigned_at).toLocaleDateString() : 'N/A';
          const dueDate = item.due_at ? new Date(item.due_at).toLocaleDateString() : undefined;
          const completedDate = item.completed_at ? new Date(item.completed_at).toLocaleDateString() : undefined;

          return {
            id: item.id,
            team_member: userLookup.get(item.auth_id) || 'Unknown User',
            item_name: itemName,
            item_type: item.item_type === 'module' ? 'Training Module' : 'Training Document',
            status: status,
            assigned_at: assignedDate,
            due_date: dueDate,
            completed_at: completedDate,
          };
        });

        const totalAssignments = allAssignments.length;

        // Calculate completed assignments
        const completedAssignments = allAssignments.filter((a) => !!a.completed_at).length;

        // Calculate incomplete assignments
        const incompleteAssignments = allAssignments.filter((a) => !a.completed_at).length;

        // Calculate overdue assignments
        const now = new Date();
        const overdueAssignments = allAssignments.filter(
          (a) => a.due_at && !a.completed_at && new Date(a.due_at) < now
        ).length;

        // Calculate compliance rate
        const complianceRate = totalAssignments > 0
          ? Math.round((completedAssignments / totalAssignments) * 100)
          : 0;

        if (isMounted) {
          setStats({
            totalAssignments,
            completedAssignments,
            incompleteAssignments,
            overdueAssignments,
            complianceRate,
          });
          setAssignmentData(transformedAssignments);
        }
      } catch (err: any) {
        console.error("Unexpected error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load training stats");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDepartmentTrainingStats();

    return () => {
      isMounted = false;
    };
  }, [departmentId]);

  if (loading) {
    return (
      <div className="neon-panel">
        <p className="training-loading-text">Loading training compliance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neon-panel">
        <h3 className="training-widget-title">
          Training Compliance - {departmentName}
        </h3>
        <p className="training-error-text">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="neon-panel">
      <h3 className="training-widget-title">
        Training Compliance - {departmentName}
      </h3>

      {/* Compliance Rate Circle */}        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.5rem",
            padding: "1rem",
            background: "var(--training-accent-light)",
            borderRadius: "12px"
          }}
        >
        <div style={{ flex: 1 }}>
          <p className="compliance-rate-label">
            Overall Compliance Rate
          </p>
          <p className="compliance-rate-text">
            {stats.complianceRate}%
          </p>
        </div>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: stats.complianceRate >= 80 ? "var(--status-success)" : stats.complianceRate >= 50 ? "var(--status-warning)" : "var(--status-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 8px ${stats.complianceRate >= 80 ? "var(--status-success)" : stats.complianceRate >= 50 ? "var(--status-warning)" : "var(--status-danger)"}`
          }}
        >
          <span className="compliance-circle-text">
            {stats.complianceRate}%
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap"
        }}
      >
        {/* Total Assignments */}
        <div
          onClick={() => {
            setActiveCard('total');
            setDialogOpen(true);
          }}
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "var(--training-accent-medium)",
            borderRadius: "8px",
            border: "1px solid var(--status-info)",
            borderLeft: "4px solid var(--status-info)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiHash size={16} color="var(--status-info)" />
            <span className="stats-card-label">Total</span>
          </div>
          <p className="stats-card-number">
            {stats.totalAssignments}
          </p>
        </div>

        {/* Completed */}
        <div
          onClick={() => {
            setActiveCard('completed');
            setDialogOpen(true);
          }}
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "var(--status-success-light)",
            borderRadius: "8px",
            border: "1px solid var(--status-success)",
            borderLeft: "4px solid var(--status-success)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiCheckCircle size={16} color="var(--status-success)" />
            <span className="stats-card-label">Done</span>
          </div>
          <p className="stats-card-number" style={{ color: "var(--status-success)" }}>
            {stats.completedAssignments}
          </p>
        </div>

        {/* Incomplete */}
        <div
          onClick={() => {
            setActiveCard('pending');
            setDialogOpen(true);
          }}
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "var(--status-warning-light)",
            borderRadius: "8px",
            border: "1px solid var(--status-warning)",
            borderLeft: "4px solid var(--status-warning)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiClock size={16} color="var(--status-warning)" />
            <span className="stats-card-label">Pending</span>
          </div>
          <p className="stats-card-number" style={{ color: "var(--status-warning)" }}>
            {stats.incompleteAssignments}
          </p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => {
            setActiveCard('overdue');
            setDialogOpen(true);
          }}
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "var(--status-danger-light)",
            borderRadius: "8px",
            border: "1px solid var(--status-danger)",
            borderLeft: "4px solid var(--status-danger)",
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiAlertCircle size={16} color="var(--status-danger)" />
            <span className="stats-card-label">Overdue</span>
          </div>
          <p className="stats-card-number" style={{ color: "var(--status-danger)" }}>
            {stats.overdueAssignments}
          </p>
        </div>
      </div>

      {/* Statistics Dialog */}
      <OverlayDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        width={600}
        ariaLabelledby="training-stats-dialog"
      >
        <div style={{ padding: "0" }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(64, 224, 208, 0.2)"
          }}>
            <h3 id="training-stats-dialog" style={{ 
              color: "var(--header-text)", 
              margin: "0", 
              fontSize: "1.25rem" 
            }}>
              Training Statistics Details
            </h3>
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0.5rem",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close"
            >
              <FiX size={20} color="var(--text-white)" />
            </button>
          </div>

          {activeCard === 'total' && (
            <div>
              <h4 style={{ 
                color: "var(--status-info)", 
                margin: "0 0 1rem 0", 
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <FiHash size={20} />
                All Training Assignments ({stats.totalAssignments})
              </h4>
              <div className="overflow-x-auto">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th className="neon-table-header-left">Team Member</th>
                      <th className="neon-table-header-left">Training Item</th>
                      <th className="neon-table-header-left">Due Date</th>
                      <th className="neon-table-header-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((item) => (
                      <tr key={item.id}>
                        <td className="neon-table-name">{item.team_member}</td>
                        <td>{item.item_name}</td>
                        <td>
                          {item.status === 'Completed' ? '—' : (
                            item.due_date ? (
                              <span className={`neon-badge ${
                                new Date(item.due_date) < new Date() 
                                  ? 'neon-badge-danger' 
                                  : 'neon-badge-warning'
                              }`}>
                                {item.due_date}
                              </span>
                            ) : '—'
                          )}
                        </td>
                        <td>
                          {item.status === 'Completed' ? (
                            <span className="neon-badge neon-badge-success">
                              {item.completed_at}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeCard === 'completed' && (
            <div>
              <h4 style={{ 
                color: "var(--status-success)", 
                margin: "0 0 1rem 0", 
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <FiCheckCircle size={20} />
                Completed Assignments ({stats.completedAssignments})
              </h4>
              <div className="overflow-x-auto">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th className="neon-table-header-left">Team Member</th>
                      <th className="neon-table-header-left">Training Item</th>
                      <th className="neon-table-header-left">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((item) => (
                      <tr key={item.id}>
                        <td className="neon-table-name">{item.team_member}</td>
                        <td>{item.item_name}</td>
                        <td>
                          <span className="neon-badge neon-badge-success">
                            {item.completed_at}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeCard === 'pending' && (
            <div>
              <h4 style={{ 
                color: "var(--status-warning)", 
                margin: "0 0 1rem 0", 
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <FiClock size={20} />
                Pending Assignments ({stats.incompleteAssignments})
              </h4>
              <div className="overflow-x-auto">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th className="neon-table-header-left">Team Member</th>
                      <th className="neon-table-header-left">Training Item</th>
                      <th className="neon-table-header-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((item) => (
                      <tr key={item.id}>
                        <td className="neon-table-name">{item.team_member}</td>
                        <td>{item.item_name}</td>
                        <td>
                          {item.due_date ? (
                            <span className={`neon-badge ${
                              new Date(item.due_date) < new Date() 
                                ? 'neon-badge-danger' 
                                : 'neon-badge-warning'
                            }`}>
                              {item.due_date}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeCard === 'overdue' && (
            <div>
              <h4 style={{ 
                color: "var(--status-danger)", 
                margin: "0 0 1rem 0", 
                fontSize: "1.125rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <FiAlertCircle size={20} />
                Overdue Assignments ({stats.overdueAssignments})
              </h4>
              <div className="overflow-x-auto">
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th className="neon-table-header-left">Team Member</th>
                      <th className="neon-table-header-left">Training Item</th>
                      <th className="neon-table-header-left">Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredData().map((item) => {
                      const daysOverdue = item.due_date 
                        ? Math.floor((new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <tr key={item.id}>
                          <td className="neon-table-name">{item.team_member}</td>
                          <td>{item.item_name}</td>
                          <td>
                            <span className="neon-badge neon-badge-danger">
                              {item.due_date} ({daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </OverlayDialog>

      {/* Summary text */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "var(--training-accent-light)",
          borderRadius: "8px"
        }}
      >
        {stats.complianceRate >= 90 ? (
          <p className="training-summary-text">
            Excellent! Your department has a strong training compliance rate.
          </p>
        ) : stats.complianceRate >= 70 ? (
          <p className="training-summary-text">
            Good progress. {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} remaining.
          </p>
        ) : stats.complianceRate >= 50 ? (
          <p className="training-summary-text">
            Attention needed. {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} still pending.
          </p>
        ) : (
          <p className="training-summary-text">
            Urgent: {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} need completion.
          </p>
        )}
      </div>
    </div>
  );
}
