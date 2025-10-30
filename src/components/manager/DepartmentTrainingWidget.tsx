"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiCheckCircle, FiAlertCircle, FiClock } from "react-icons/fi";

interface DepartmentTrainingStats {
  totalAssignments: number;
  completedAssignments: number;
  incompleteAssignments: number;
  overdueAssignments: number;
  complianceRate: number;
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
        // Fetch all assignments for users in this department
        const { data: assignments, error: assignmentsError } = await supabase
          .from("user_assignments")
          .select(
            `auth_id, item_id, item_type, completed_at, due_at,
            users:users!inner(department_id)`
          )
          .in("item_type", ["module", "document"])
          .eq("users.department_id", departmentId);

        if (!isMounted) return;

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError);
          setError(assignmentsError.message);
          setLoading(false);
          return;
        }

        const allAssignments = assignments || [];
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
      <div
        className="neon-panel"
        style={{
          background: "#0d3c47",
          color: "#fff",
          borderRadius: "18px",
          padding: "1.5rem",
          minHeight: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <p style={{ opacity: 0.7 }}>Loading training compliance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="neon-panel"
        style={{
          background: "#0d3c47",
          color: "#fff",
          borderRadius: "18px",
          padding: "1.5rem"
        }}
      >
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", fontWeight: 600, color: "#19e6d9" }}>
          Training Compliance - {departmentName}
        </h3>
        <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div
      className="neon-panel"
      style={{
        background: "#0d3c47",
        color: "#fff",
        borderRadius: "18px",
        padding: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)"
      }}
    >
      <h3
        style={{
          margin: "0 0 1rem 0"
        }}
      >
        Training Compliance - {departmentName}
      </h3>

      {/* Compliance Rate Circle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "rgba(25, 230, 217, 0.05)",
          borderRadius: "12px"
        }}
      >
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.85rem", opacity: 0.8, margin: "0 0 0.25rem 0" }}>
            Overall Compliance Rate
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 700, color: "#19e6d9", margin: 0 }}>
            {stats.complianceRate}%
          </p>
        </div>
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: "50%",
            background: stats.complianceRate >= 80 ? "#22c55e" : stats.complianceRate >= 50 ? "#f97316" : "#ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 8px ${stats.complianceRate >= 80 ? "#22c55e" : stats.complianceRate >= 50 ? "#f97316" : "#ef4444"}`
          }}
        >
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>
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
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "rgba(25, 230, 217, 0.1)",
            borderRadius: "8px",
            borderLeft: "4px solid #19e6d9"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiCheckCircle size={16} color="#19e6d9" />
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Total</span>
          </div>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0 }}>
            {stats.totalAssignments}
          </p>
        </div>

        {/* Completed */}
        <div
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "rgba(34, 197, 94, 0.1)",
            borderRadius: "8px",
            borderLeft: "4px solid #22c55e"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiCheckCircle size={16} color="#22c55e" />
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Done</span>
          </div>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "#22c55e" }}>
            {stats.completedAssignments}
          </p>
        </div>

        {/* Incomplete */}
        <div
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "rgba(249, 115, 22, 0.1)",
            borderRadius: "8px",
            borderLeft: "4px solid #f97316"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiClock size={16} color="#f97316" />
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Pending</span>
          </div>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "#f97316" }}>
            {stats.incompleteAssignments}
          </p>
        </div>

        {/* Overdue */}
        <div
          style={{
            flex: "1",
            minWidth: "120px",
            padding: "0.75rem",
            background: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            borderLeft: "4px solid #ef4444"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <FiAlertCircle size={16} color="#ef4444" />
            <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>Overdue</span>
          </div>
          <p style={{ fontSize: "1.3rem", fontWeight: 700, margin: 0, color: "#ef4444" }}>
            {stats.overdueAssignments}
          </p>
        </div>
      </div>

      {/* Summary text */}
      <div
        style={{
          marginTop: "1rem",
          padding: "0.75rem",
          background: "rgba(25, 230, 217, 0.05)",
          borderRadius: "8px",
          fontSize: "0.85rem",
          opacity: 0.9
        }}
      >
        {stats.complianceRate >= 90 ? (
          <p style={{ margin: 0 }}>
            Excellent! Your department has a strong training compliance rate.
          </p>
        ) : stats.complianceRate >= 70 ? (
          <p style={{ margin: 0 }}>
            Good progress. {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} remaining.
          </p>
        ) : stats.complianceRate >= 50 ? (
          <p style={{ margin: 0 }}>
            Attention needed. {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} still pending.
          </p>
        ) : (
          <p style={{ margin: 0 }}>
            Urgent: {stats.incompleteAssignments} assignment{stats.incompleteAssignments !== 1 ? 's' : ''} need completion.
          </p>
        )}
      </div>
    </div>
  );
}
