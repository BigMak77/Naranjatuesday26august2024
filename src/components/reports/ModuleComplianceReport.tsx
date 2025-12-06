"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiSearch, FiFileText, FiX, FiDownload, FiPrinter } from "react-icons/fi";
import OverlayDialog from "@/components/ui/OverlayDialog";

type Module = {
  id: string;
  name: string;
  version: number;
  updated_at: string | null;
  category_id: string | null;
  created_at: string;
};

type Document = {
  id: string;
  title: string;
  module_id: string | null;
};

type Assignment = {
  auth_id: string;
  item_id: string;
  item_type: "module" | "document";
  completed_at: string | null;
};


type User = {
  auth_id: string;
  name: string;
  employee_number: string | null;
  department: string | null;
  shift: string | null;
};

type ModuleStats = {
  module: Module;
  totalAssigned: number;
  completed: number;
  notCompleted: number;
  reviewNeeded: number;
  historical: number;
  documents: Document[];
  completedUsers: User[];
  notCompletedUsers: User[];
  historicalUsers: User[];
};

export default function ModuleComplianceReport() {
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPercentage, setShowPercentage] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogUsers, setDialogUsers] = useState<User[]>([]);
  const [dialogSearchTerm, setDialogSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [modulesRes, assignmentsRes, documentsRes, usersRes] = await Promise.all([
        supabase.from("modules").select("*").order("name", { ascending: true }),
        supabase.from("user_assignments").select("auth_id, item_id, item_type, completed_at"),
        supabase.from("documents").select("id, title, module_id"),
        supabase.from("users").select("auth_id, first_name, last_name, employee_number, department_id, shift_id"),
      ]);

      if (modulesRes.data) setModules(modulesRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);
      if (documentsRes.data) setDocuments(documentsRes.data);
      if (usersRes.data) {
        // Fetch departments to map department IDs to names
        const deptIds = [...new Set(usersRes.data.map((u: any) => u.department_id).filter(Boolean))];
        const shiftIds = [...new Set(usersRes.data.map((u: any) => u.shift_id).filter(Boolean))];

        const [deptsRes, shiftsRes] = await Promise.all([
          supabase.from("departments").select("id, name").in("id", deptIds),
          supabase.from("shift_patterns").select("id, name").in("id", shiftIds),
        ]);

        const deptMap = new Map(deptsRes.data?.map((d: any) => [d.id, d.name]) || []);
        const shiftMap = new Map(shiftsRes.data?.map((s: any) => [s.id, s.name]) || []);

        setUsers(
          usersRes.data.map((u: any) => ({
            auth_id: u.auth_id,
            name: `${u.first_name} ${u.last_name}`.trim(),
            employee_number: u.employee_number || null,
            department: u.department_id ? deptMap.get(u.department_id) || null : null,
            shift: u.shift_id ? shiftMap.get(u.shift_id) || null : null,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const moduleStats: ModuleStats[] = useMemo(() => {
    return modules.map((module) => {
      // Get all assignments for this module
      const moduleAssignments = assignments.filter(
        (a) => a.item_type === "module" && a.item_id === module.id
      );

      // All completions (current and historical) are now in user_assignments

      const completedAssignments = moduleAssignments.filter((a) => a.completed_at !== null);
      const notCompletedAssignments = moduleAssignments.filter((a) => a.completed_at === null);

      const totalAssigned = moduleAssignments.length;
      const completed = completedAssignments.length;
      const notCompleted = notCompletedAssignments.length;
      const reviewNeeded = 0; // Review needed column doesn't exist in user_assignments
      const historical = 0; // Historical completions are now preserved in user_assignments

      // Get documents attached to this module
      const moduleDocuments = documents.filter((d) => d.module_id === module.id);

      // Get user lists for each category
      const completedUsers = completedAssignments
        .map((a) => users.find((u) => u.auth_id === a.auth_id))
        .filter((u): u is User => u !== undefined);

      const notCompletedUsers = notCompletedAssignments
        .map((a) => users.find((u) => u.auth_id === a.auth_id))
        .filter((u): u is User => u !== undefined);

      const historicalUsers: User[] = []; // Historical completions are now preserved in user_assignments

      return {
        module,
        totalAssigned,
        completed,
        notCompleted,
        reviewNeeded,
        historical,
        documents: moduleDocuments,
        completedUsers,
        notCompletedUsers,
        historicalUsers,
      };
    });
  }, [modules, assignments, documents, users]);

  const filteredStats = useMemo(() => {
    return moduleStats.filter((stat) => {
      const matchesSearch = stat.module.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [moduleStats, searchTerm]);

  const formatValue = (value: number, total: number) => {
    if (showPercentage && total > 0) {
      return `${Math.round((value / total) * 100)}%`;
    }
    return value.toString();
  };

  const handleOpenDialog = (title: string, userList: User[]) => {
    setDialogTitle(title);
    setDialogUsers(userList);
    setDialogSearchTerm("");
    setDialogOpen(true);
  };

  const filteredDialogUsers = useMemo(() => {
    if (!dialogSearchTerm) return dialogUsers;
    const searchLower = dialogSearchTerm.toLowerCase();
    return dialogUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchLower) ||
        user.employee_number?.toLowerCase().includes(searchLower) ||
        user.department?.toLowerCase().includes(searchLower) ||
        user.shift?.toLowerCase().includes(searchLower)
    );
  }, [dialogUsers, dialogSearchTerm]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const csv = [
      ["Name", "Employee #", "Department", "Shift"],
      ...filteredDialogUsers.map((u) => [
        u.name,
        u.employee_number || "",
        u.department || "",
        u.shift || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dialogTitle.replace(/ /g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-white)" }}>
        Loading compliance data...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", margin: "0 auto", padding: "0 24px" }}>
      {/* Filters and Controls */}
      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {/* Search */}
        <div style={{ flex: "1 1 300px", position: "relative" }}>
          <FiSearch
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-white)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 0.75rem 0.75rem 2.5rem",
              background: "var(--field)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-white)",
              fontSize: "var(--font-size-base)",
            }}
          />
        </div>

        {/* Toggle Switch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem 1rem",
            background: "var(--field)",
            borderRadius: "8px",
          }}
        >
          <span style={{ color: "var(--text-white)", fontSize: "var(--font-size-base)" }}>
            {showPercentage ? "Percentage" : "Number"}
          </span>
          <button
            onClick={() => setShowPercentage(!showPercentage)}
            style={{
              width: "50px",
              height: "26px",
              background: showPercentage ? "var(--neon)" : "#4b5563",
              border: "none",
              borderRadius: "13px",
              position: "relative",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                background: "#fff",
                borderRadius: "50%",
                position: "absolute",
                top: "3px",
                left: showPercentage ? "27px" : "3px",
                transition: "left 0.3s ease",
              }}
            />
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "var(--field)" }}>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  color: "var(--text-white)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Module Name
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--text-white)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Version
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--text-white)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Version Date
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--text-white)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Total Assigned
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--status-success)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Completed
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--status-danger)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Not Completed
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "var(--status-warning)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Review Needed
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Historical
              </th>
              <th
                style={{
                  padding: "1rem",
                  textAlign: "left",
                  color: "var(--text-white)",
                  fontWeight: "var(--font-weight-header)",
                  fontSize: "var(--font-size-base)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                Materials
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--text-white)",
                    opacity: 0.6,
                  }}
                >
                  No modules found
                </td>
              </tr>
            ) : (
              filteredStats.map((stat) => (
                <tr
                  key={stat.module.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--text-white)",
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    <strong>{stat.module.name}</strong>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "var(--text-white)",
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    {stat.module.version}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "var(--text-white)",
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    {stat.module.updated_at ? new Date(stat.module.updated_at).toLocaleDateString() : "-"}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                      color: "var(--text-white)",
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    {stat.totalAssigned}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <span
                      onClick={() => handleOpenDialog(`${stat.module.name} - Completed`, stat.completedUsers)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        background: "rgba(34, 197, 94, 0.1)",
                        border: "1px solid var(--status-success)",
                        color: "var(--status-success)",
                        fontSize: "var(--font-size-base)",
                        fontWeight: "var(--font-weight-header)",
                        width: "70px",
                        minWidth: "70px",
                        maxWidth: "70px",
                        cursor: "pointer",
                      }}
                    >
                      {formatValue(stat.completed, stat.totalAssigned)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <span
                      onClick={() => handleOpenDialog(`${stat.module.name} - Not Completed`, stat.notCompletedUsers)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid var(--status-danger)",
                        color: "var(--status-danger)",
                        fontSize: "var(--font-size-base)",
                        fontWeight: "var(--font-weight-header)",
                        width: "70px",
                        minWidth: "70px",
                        maxWidth: "70px",
                        cursor: "pointer",
                      }}
                    >
                      {formatValue(stat.notCompleted, stat.totalAssigned)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        background: "rgba(249, 115, 22, 0.1)",
                        border: "1px solid var(--status-warning)",
                        color: "var(--status-warning)",
                        fontSize: "var(--font-size-base)",
                        fontWeight: "var(--font-weight-header)",
                        width: "70px",
                        minWidth: "70px",
                        maxWidth: "70px",
                      }}
                    >
                      {formatValue(stat.reviewNeeded, stat.totalAssigned)}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      textAlign: "center",
                    }}
                  >
                    <span
                      onClick={() => handleOpenDialog(`${stat.module.name} - Historical`, stat.historicalUsers)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.5rem",
                        borderRadius: "8px",
                        background: "rgba(107, 114, 128, 0.1)",
                        border: "1px solid #6b7280",
                        color: "#9ca3af",
                        fontSize: "var(--font-size-base)",
                        fontWeight: "var(--font-weight-header)",
                        width: "70px",
                        minWidth: "70px",
                        maxWidth: "70px",
                        cursor: "pointer",
                      }}
                    >
                      {stat.historical}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "var(--text-white)",
                      fontSize: "var(--font-size-base)",
                    }}
                  >
                    {stat.documents.length === 0 ? (
                      ""
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {stat.documents.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <FiFileText size={14} style={{ color: "var(--neon)" }} />
                            <span>{doc.title}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--text-white)", fontWeight: "var(--font-weight-header)" }}>
            {filteredStats.length}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Modules
          </div>
        </div>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--status-success)", fontWeight: "var(--font-weight-header)" }}>
            {filteredStats.reduce((sum, stat) => sum + stat.completed, 0)}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Completed
          </div>
        </div>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--status-danger)", fontWeight: "var(--font-weight-header)" }}>
            {filteredStats.reduce((sum, stat) => sum + stat.notCompleted, 0)}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Not Completed
          </div>
        </div>
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2rem", color: "var(--status-warning)", fontWeight: "var(--font-weight-header)" }}>
            {filteredStats.reduce((sum, stat) => sum + stat.reviewNeeded, 0)}
          </div>
          <div style={{ color: "var(--text-white)", opacity: 0.8, fontSize: "var(--font-size-base)" }}>
            Total Review Needed
          </div>
        </div>
      </div>

      {/* User List Dialog */}
      <OverlayDialog open={dialogOpen} onClose={() => setDialogOpen(false)} width={1100}>
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
          <h2
            style={{
              color: "var(--text-white)",
              fontSize: "var(--font-size-header)",
              fontWeight: "var(--font-weight-header)",
              margin: 0,
            }}
          >
            {dialogTitle}
          </h2>
          <button
            onClick={() => setDialogOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-white)",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Search and Action Buttons */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 300px", position: "relative" }}>
            <FiSearch
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-white)",
                opacity: 0.6,
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={dialogSearchTerm}
              onChange={(e) => setDialogSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                background: "var(--field)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-white)",
                fontSize: "var(--font-size-base)",
              }}
            />
          </div>

          <button
            onClick={handleDownload}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "var(--neon)",
              border: "none",
              borderRadius: "8px",
              color: "#000",
              cursor: "pointer",
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-header)",
            }}
          >
            <FiDownload size={18} />
            Download
          </button>

          <button
            onClick={handlePrint}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1rem",
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-white)",
              cursor: "pointer",
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-header)",
            }}
          >
            <FiPrinter size={18} />
            Print
          </button>
        </div>

        {filteredDialogUsers.length === 0 ? (
          <p style={{ color: "var(--text-white)", textAlign: "center", opacity: 0.6 }}>
            {dialogSearchTerm ? "No matching users found" : "No users in this category"}
          </p>
        ) : (
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: "8px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "var(--panel)",
              }}
            >
              <thead>
                <tr style={{ background: "var(--field)" }}>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      color: "var(--text-white)",
                      fontWeight: "var(--font-weight-header)",
                      fontSize: "var(--font-size-base)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Name
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      color: "var(--text-white)",
                      fontWeight: "var(--font-weight-header)",
                      fontSize: "var(--font-size-base)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Employee #
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      color: "var(--text-white)",
                      fontWeight: "var(--font-weight-header)",
                      fontSize: "var(--font-size-base)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Department
                  </th>
                  <th
                    style={{
                      padding: "1rem",
                      textAlign: "left",
                      color: "var(--text-white)",
                      fontWeight: "var(--font-weight-header)",
                      fontSize: "var(--font-size-base)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    Shift
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDialogUsers.map((user, index) => (
                  <tr
                    key={user.auth_id || index}
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-white)",
                        fontSize: "var(--font-size-base)",
                      }}
                    >
                      {user.name}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-white)",
                        fontSize: "var(--font-size-base)",
                      }}
                    >
                      {user.employee_number || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-white)",
                        fontSize: "var(--font-size-base)",
                      }}
                    >
                      {user.department || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "var(--text-white)",
                        fontSize: "var(--font-size-base)",
                      }}
                    >
                      {user.shift || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
      </OverlayDialog>
    </div>
  );
}
